import { RedisClientType } from "redis";
import { randomBytes } from "node:crypto";

import { generateOtp } from "../util/otp";
import { hashOtp } from "../util/crypto";

const LOGIN_REQUEST_RATE = 5;
const AUTH_OTP_TTL_SECONDS = 60;
const AUTH_LOGIN_VERIFY_MAX_ATTEMPTS = 5;

const SESSION_TTL_SECONDS = 8 * 60 * 60;

const requestLoginRateKey = (email: string) => `admin:auth:request:attemps:${email}`;
const adminAuthLoginKey = (hash: string) => `admin:auth:${hash}`;
const adminAuthLoginAttemptsKey = (email: string) => `admin:auth:verify:attemps:${email}`;
const adminSessionKey = (hash: string) => `admin:session:${hash}`;

export type AuthOtpVerification =
  | { status: "verified"; session: { token: string; expiresAt: number } }
  | { status: "invalid" | "expired" | "too_many_attempts" };

export async function requestAdminAuthLogin(
  email: string,
  redis: RedisClientType,
): Promise<{ status: "sent"; otp: string } | { status: "rate_limited" }> {
  const allowed = await redis.set(requestLoginRateKey(email), "1", {
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
    .hSet(hash, { attemps: 0, createdAt: Date.now() })
    .expire(hash, AUTH_OTP_TTL_SECONDS)
    .exec();

  return { status: "sent", otp };
}

export async function verifyAdminAuthLogin(email: string, otp: string, redis: RedisClientType) {
  const key = adminAuthLoginKey(hashOtp(email, otp));
  const attempts = await redis.hIncrBy(adminAuthLoginAttemptsKey(email), "attempts", 1);

  if (attempts > AUTH_LOGIN_VERIFY_MAX_ATTEMPTS) {
    await redis.multi().del(key).del(adminAuthLoginAttemptsKey(email)).exec();
    return { status: "too_many_attempts" };
  }

  const record = await redis.hGetAll(key);

  if (!record) {
    return { status: "invalid" };
  }

  const session = await createWebSession({ email: email }, redis);

  return { status: "verified", session };
}

export interface AdminAuth {
  email: string;
}

export interface WebSession {
  user: AdminAuth;
  expiresAt: number;
}

export async function createWebSession(
  user: AdminAuth,
  redis: RedisClientType,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await redis
    .multi()
    .hSet(adminSessionKey(token), {
      user: user.email,
      email: user.email,
      createdAt: Date.now(),
      expiresAt,
    })
    .expire(adminSessionKey(token), SESSION_TTL_SECONDS)
    .exec();

  return { token, expiresAt };
}

export async function getWebSession(
  token: string,
  redis: RedisClientType,
): Promise<WebSession | undefined> {
  const key = adminSessionKey(token);
  const session = await redis.hGetAll(key);
  if (!session.user) {
    return undefined;
  }

  return {
    user: { email: session.user },
    expiresAt: Number(session.expiresAt ?? "0"),
  };
}

export async function deleteWebSession(token: string, redis: RedisClientType): Promise<void> {
  await redis.del(adminSessionKey(token));
}
