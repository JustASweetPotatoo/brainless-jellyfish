import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { RedisClientType } from "redis";
import { sha256 } from "../util/crypto";

const sessionKey = (token: string) => `admin:session:${sha256(token)}`;

const oauthStateKey = (state: string) =>
  `auth:oauth-state:${createHash("sha256").update(state).digest("hex")}`;

const authOtpKey = (email: string) => `auth:admin-otp:${email}`;
const requestAdminLoginRateKey = (email: string) => `auth:admin-otp-rate:${email}`;

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const OAUTH_STATE_TTL_SECONDS = 10 * 60;

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
}

export interface WebSession {
  user: AuthUser;
  expiresAt: number;
}

export async function requiredAuth(userId: string) {}

export async function createDiscordOAuthUrl(
  returnTo: string,
  redis: RedisClientType,
): Promise<string> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !process.env.DISCORD_CLIENT_SECRET || !redirectUri) {
    throw new Error("Discord OAuth is not configured.");
  }

  const state = randomBytes(32).toString("base64url");
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");

  await redis.set(
    oauthStateKey(state),
    JSON.stringify({ verifier, returnTo: safeReturnPath(returnTo) }),
    { EX: OAUTH_STATE_TTL_SECONDS },
  );

  const authorizationUrl = new URL("https://discord.com/oauth2/authorize");
  authorizationUrl.searchParams.set("client_id", clientId);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("scope", "identify email");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  return authorizationUrl.toString();
}

function safeReturnPath(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/dashboard";
  }
  return path;
}

export async function completeDiscordOAuth(
  code: string,
  state: string,
  redis: RedisClientType,
): Promise<{ user: AuthUser; returnTo: string; session: { token: string; expiresAt: number } }> {
  const encodedState = await redis.getDel(oauthStateKey(state));
  if (!encodedState) {
    throw new Error("Discord OAuth state is invalid or expired.");
  }

  const savedState = JSON.parse(encodedState) as { verifier: string; returnTo: string };
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Discord OAuth is not configured.");
  }

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: savedState.verifier,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) {
    throw new Error("Discord rejected the OAuth authorization code.");
  }

  const token = (await tokenResponse.json()) as { access_token: string; token_type: string };
  const userResponse = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `${token.token_type} ${token.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!userResponse.ok) {
    throw new Error("Unable to retrieve the Discord account.");
  }

  const discordUser = (await userResponse.json()) as {
    id: string;
    username: string;
    global_name?: string | null;
    email?: string | null;
    avatar?: string | null;
  };
  const avatar = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.${discordUser.avatar.startsWith("a_") ? "gif" : "png"}`
    : undefined;
  const user: AuthUser = {
    id: discordUser.id,
    username: discordUser.username,
    email: discordUser.email ?? "",
    displayName: discordUser.global_name ?? discordUser.username,
    avatar,
  };
  const session = await createWebSession(user, redis);

  return { user, returnTo: savedState.returnTo, session };
}

export async function createWebSession(
  user: AuthUser,
  redis: RedisClientType,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await redis
    .multi()
    .hSet(sessionKey(token), {
      email: user.email,
      createdAt: Date.now(),
      expiresAt,
      user: JSON.stringify(user),
    })
    .expire(sessionKey(token), SESSION_TTL_SECONDS)
    .exec();

  return { token, expiresAt };
}

export async function getWebSession(
  token: string,
  redis: RedisClientType,
): Promise<WebSession | undefined> {
  const session = await redis.hGetAll(sessionKey(token));
  if (!session.user || !session.expiresAt) {
    return undefined;
  }

  return {
    user: JSON.parse(session.user) as AuthUser,
    expiresAt: Number(session.expiresAt),
  };
}

export async function deleteWebSession(token: string, redis: RedisClientType): Promise<void> {
  await redis.del(sessionKey(token));
}

export async function getSession(
  token: string,
  redis: RedisClientType,
): Promise<{ email: string; createdAt: number } | undefined> {
  const key = sessionKey(token);
  const session = await redis.hGetAll(key);
  if (!session.email) {
    return undefined;
  }
  return { email: session.email, createdAt: Number(session.createdAt) };
}
