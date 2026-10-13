import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { RedisClientType } from "redis";

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const sessionKey = (token: string) => `admin:session:${sha256(token)}`;

const oauthStateKey = (state: string) =>
  `auth:oauth-state:${createHash("sha256").update(state).digest("hex")}`;

const authOtpKey = (email: string) => `auth:admin-otp:${email}`;
const requestAdminLoginRateKey = (email: string) => `auth:admin-otp-rate:${email}`;

const SESSION_TTL_SECONDS = 8 * 60 * 60;
const OAUTH_STATE_TTL_SECONDS = 10 * 60;
const AUTH_OTP_TTL_SECONDS = 10 * 60;
const LOGIN_REQUEST_RATE = 60;
const AUTH_LOGIN_VERIFY_MAX_ATTEMPS = 5;

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

export type AuthOtpVerification =
  | { status: "verified"; session: { token: string; expiresAt: number } }
  | { status: "invalid" | "expired" | "too_many_attempts" };

function hashOtp(email: string, otp: string): string {
  const secret = process.env.AUTH_OTP_SECRET ?? process.env.DISCORD_CLIENT_SECRET;
  if (!secret) {
    throw new Error("Set AUTH_OTP_SECRET or DISCORD_CLIENT_SECRET before enabling admin login.");
  }

  return createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
}

function safeEqualHex(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function sendAuthOtp(email: string, otp: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !password) {
    throw new Error("Admin email delivery is not configured.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
  });

  await transporter.sendMail({
    from: `Admin Verification <${user}>`,
    to: email,
    subject: "Admin login OTP",
    text: `Your OTP is ${otp}. The code is valid for 10 minutes. If you haven't requested this code, please ignore this email.`,
    html: `<p>Login OTP:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>The code is valid for 10 minutes.</p><p>If you haven't requested this code, please ignore this email.</p>`,
  });
}

export async function requestAuthOtp(
  email: string,
  redis: RedisClientType,
): Promise<{ status: "sent"; otp: string } | { status: "rate_limited" }> {
  const allowed = await redis.set(requestAdminLoginRateKey(email), "1", {
    EX: LOGIN_REQUEST_RATE,
    NX: true,
  });

  if (!allowed) {
    return { status: "rate_limited" };
  }

  const otp = generateOtp();
  const hash = hashOtp(email, otp);
  await redis
    .multi()
    .hSet(hash, { attempts: 0, createdAt: Date.now() })
    .expire(authOtpKey(email), AUTH_OTP_TTL_SECONDS)
    .exec();

  return { status: "sent", otp };
}

export async function clearAuthOtp(email: string, redis: RedisClientType): Promise<void> {
  await redis.del(authOtpKey(email));
}

export async function verifyAuthOtp(
  email: string,
  otp: string,
  redis: RedisClientType,
): Promise<AuthOtpVerification> {
  const key = authOtpKey(hashOtp(email, otp));
  const record = await redis.hGetAll(key);
  const attempts = await redis.hIncrBy(key, "attempts", 1);

  if (attempts > AUTH_LOGIN_VERIFY_MAX_ATTEMPS) {
    await redis.del(key);
    return { status: "too_many_attempts" };
  }

  if (!record) {
    return { status: "invalid" };
  }

  await redis.del(key);

  const session = await createWebSession(
    {
      id: `admin:${email}`,
      username: email.split("@")[0],
      email,
      displayName: "Administrator",
    },
    redis,
  );

  return { status: "verified", session };
}

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
