import { RedisClientType } from "redis";
import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";

import { generateOtp } from "../util/otp";
import { hashOtp, sha256 } from "../util/crypto";

const LOGIN_REQUEST_RATE = 5;
const AUTH_OTP_TTL_SECONDS = 60;
const AUTH_LOGIN_VERIFY_MAX_ATTEMPTS = 5;

const SESSION_TTL_SECONDS = 8 * 60 * 60;

const requestLoginRateKey = (email: string) => `admin:auth:request:attemps:${email}`;
const adminAuthLoginKey = (hash: string) => `admin:auth:${hash}`;
const requestAuthVerifyLoginAdminRateKey = (email: string) => `admin:auth:verify:attemps:${email}`;
const adminSessionKey = (hash: string) => `admin:session:${hash}`;
const authOtpKey = (email: string) => `auth:admin-otp:${email}`;

export type AuthOtpVerification =
  | { status: "verified"; session: { token: string; expiresAt: number } }
  | { status: "invalid" | "expired" | "too_many_attempts" };

export interface AdminAuth {
  email: string;
}

export interface WebSession {
  user: AdminAuth;
  expiresAt: number;
}

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
  const key = adminAuthLoginKey(hash);

  await redis
    .multi()
    .hSet(key, { attemps: 0, createdAt: Date.now() })
    .expire(key, AUTH_OTP_TTL_SECONDS)
    .exec();

  return { status: "sent", otp };
}

export async function verifyAdminAuthLogin(email: string, otp: string, redis: RedisClientType) {
  const key = adminAuthLoginKey(hashOtp(email, otp));

  const allowed = await redis.set(requestAuthVerifyLoginAdminRateKey(email), "1", {
    EX: AUTH_LOGIN_VERIFY_MAX_ATTEMPTS,
    NX: true,
  });

  if (!allowed) {
    await redis.multi().del(key).del(requestAuthVerifyLoginAdminRateKey(email)).exec();
    return { status: "too_many_attempts" };
  }

  const record = await redis.hGetAll(key);

  if (!record) {
    return { status: "invalid" };
  }

  const session = await createWebSession({ email: email }, redis);

  return { status: "verified", session };
}

export async function sendAdminAuthOtp(email: string, otp: string): Promise<void> {
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

export async function clearAdminAuthOtp(email: string, redis: RedisClientType): Promise<void> {
  await redis.del(authOtpKey(email));
}

export async function createWebSession(
  user: AdminAuth,
  redis: RedisClientType,
): Promise<{ token: string; expiresAt: number }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  await redis
    .multi()
    .hSet(adminSessionKey(sha256(token)), {
      user: user.email,
      email: user.email,
      createdAt: Date.now(),
      expiresAt,
    })
    .expire(adminSessionKey(sha256(token)), SESSION_TTL_SECONDS)
    .exec();

  return { token, expiresAt };
}

export async function getWebSession(
  token: string,
  redis: RedisClientType,
): Promise<WebSession | undefined> {
  const key = adminSessionKey(sha256(token));
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
  await redis.del(adminSessionKey(sha256(token)));
}
