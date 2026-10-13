/**
 * Đăng nhập bằng Email + OTP với Fastify, TypeScript, Redis.
 *
 * Cài đặt:
 *   npm init -y
 *   npm i fastify ioredis nodemailer
 *   npm i -D typescript tsx @types/node @types/nodemailer 
 *
 * Chạy (cần Redis đang chạy ở localhost:6379):
 *   npx tsx server.ts
 *
 * Biến môi trường (tuỳ chọn):
 *   PORT=3000
 *   REDIS_URL=redis://localhost:6379
 *   OTP_SECRET=chuoi-bi-mat-dai-ngau-nhien     (BẮT BUỘC đổi ở production)
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
 *   (không đặt SMTP_HOST => OTP được in ra console, tiện cho dev)
 *
 * Luồng:
 *   1. POST /auth/request-otp  { email }                 -> tạo LOGIN SESSION (Redis, TTL ngắn), gửi OTP
 *   2. POST /auth/verify-otp   { loginSessionId, otp }   -> xoá login session, tạo AUTH SESSION (Redis, TTL dài)
 *   3. GET  /me                Authorization: Bearer <accessToken>
 *   4. POST /auth/logout       Authorization: Bearer <accessToken>
 */

import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import Redis from "ioredis";
import nodemailer from "nodemailer";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

// ───────────────────────── Config ─────────────────────────
const PORT = Number(process.env.PORT ?? 3000);
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const OTP_SECRET = process.env.OTP_SECRET ?? "dev-only-secret-change-me";

const OTP_TTL_SECONDS = 5 * 60; // login session / OTP sống 5 phút
const OTP_MAX_ATTEMPTS = 5; // nhập sai tối đa 5 lần
const AUTH_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // auth session sống 7 ngày
const RATE_LIMIT_WINDOW_SECONDS = 10 * 60; // cửa sổ giới hạn gửi OTP
const RATE_LIMIT_MAX_REQUESTS = 5; // tối đa 5 OTP / email / 10 phút

// ───────────────────────── Redis ─────────────────────────
const redis = new Redis(REDIS_URL);

// Tên key
const loginKey = (id: string) => `login_session:${id}`;
const loginByEmailKey = (email: string) => `login_session_by_email:${email}`;
const authKey = (tokenHash: string) => `auth_session:${tokenHash}`;
const rateKey = (email: string) => `otp_rate:${email}`;

// ───────────────────────── Helpers ─────────────────────────
const normalizeEmail = (email: string) => email.trim().toLowerCase();

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

const hashOtp = (loginSessionId: string, otp: string) =>
  createHmac("sha256", OTP_SECRET).update(`${loginSessionId}:${otp}`).digest("hex");

const safeEqualHex = (a: string, b: string) => {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
};

const generateOtp = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

const mailer = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    })
  : null;

async function sendOtpEmail(email: string, otp: string) {
  if (!mailer) {
    console.log(`[DEV] OTP cho ${email}: ${otp}`);
    return;
  }
  await mailer.sendMail({
    from: process.env.MAIL_FROM ?? "no-reply@example.com",
    to: email,
    subject: "Mã đăng nhập của bạn",
    text: `Mã OTP của bạn là ${otp}. Mã có hiệu lực trong ${OTP_TTL_SECONDS / 60} phút.`,
  });
}

// ───────────────────────── Fastify ─────────────────────────
type AuthUser = { email: string };

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
    tokenHash?: string;
  }
}

const app = Fastify({ logger: true });

// Middleware xác thực: đọc Bearer token -> tra auth session trong Redis
async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return reply.code(401).send({ error: "Thiếu access token" });

  const tokenHash = sha256(token);
  const session = await redis.hgetall(authKey(tokenHash));
  if (!session.email) return reply.code(401).send({ error: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" });

  req.user = { email: session.email };
  req.tokenHash = tokenHash;
}

// 1) Yêu cầu OTP -> tạo login session
app.post<{ Body: { email: string } }>(
  "/auth/request-otp",
  {
    schema: {
      body: {
        type: "object",
        required: ["email"],
        properties: { email: { type: "string", format: "email", maxLength: 254 } },
      },
    },
  },
  async (req, reply) => {
    const email = normalizeEmail(req.body.email);

    // Giới hạn tần suất gửi OTP theo email
    const count = await redis.incr(rateKey(email));
    if (count === 1) await redis.expire(rateKey(email), RATE_LIMIT_WINDOW_SECONDS);
    if (count > RATE_LIMIT_MAX_REQUESTS) {
      return reply.code(429).send({ error: "Bạn yêu cầu OTP quá nhiều lần, vui lòng thử lại sau" });
    }

    // Huỷ login session cũ của email này (nếu có) -> mỗi email chỉ có 1 OTP hiệu lực
    const oldId = await redis.get(loginByEmailKey(email));
    if (oldId) await redis.del(loginKey(oldId));

    const loginSessionId = randomBytes(24).toString("base64url");
    const otp = generateOtp();

    await redis
      .multi()
      .hset(loginKey(loginSessionId), {
        email,
        otpHash: hashOtp(loginSessionId, otp),
        attempts: 0,
      })
      .expire(loginKey(loginSessionId), OTP_TTL_SECONDS)
      .set(loginByEmailKey(email), loginSessionId, "EX", OTP_TTL_SECONDS)
      .exec();

    await sendOtpEmail(email, otp);

    return { loginSessionId, expiresIn: OTP_TTL_SECONDS };
  }
);

// 2) Xác thực OTP -> xoá login session, tạo auth session
app.post<{ Body: { loginSessionId: string; otp: string } }>(
  "/auth/verify-otp",
  {
    schema: {
      body: {
        type: "object",
        required: ["loginSessionId", "otp"],
        properties: {
          loginSessionId: { type: "string", minLength: 10, maxLength: 100 },
          otp: { type: "string", pattern: "^[0-9]{6}$" },
        },
      },
    },
  },
  async (req, reply) => {
    const { loginSessionId, otp } = req.body;
    const key = loginKey(loginSessionId);

    const session = await redis.hgetall(key);
    if (!session.email) {
      return reply.code(400).send({ error: "Phiên đăng nhập không tồn tại hoặc đã hết hạn" });
    }

    const attempts = await redis.hincrby(key, "attempts", 1);
    if (attempts > OTP_MAX_ATTEMPTS) {
      await redis.del(key, loginByEmailKey(session.email));
      return reply.code(429).send({ error: "Nhập sai quá số lần cho phép, vui lòng yêu cầu OTP mới" });
    }

    if (!safeEqualHex(session.otpHash, hashOtp(loginSessionId, otp))) {
      return reply.code(401).send({ error: "OTP không đúng", attemptsLeft: OTP_MAX_ATTEMPTS - attempts });
    }

    // OTP đúng: dùng một lần rồi xoá login session
    await redis.del(key, loginByEmailKey(session.email));

    // Tạo auth session
    const accessToken = randomBytes(32).toString("base64url");
    const tokenHash = sha256(accessToken); // chỉ lưu hash của token trong Redis

    await redis
      .multi()
      .hset(authKey(tokenHash), {
        email: session.email,
        createdAt: Date.now(),
        userAgent: req.headers["user-agent"] ?? "",
        ip: req.ip,
      })
      .expire(authKey(tokenHash), AUTH_SESSION_TTL_SECONDS)
      .exec();

    return { accessToken, tokenType: "Bearer", expiresIn: AUTH_SESSION_TTL_SECONDS };
  }
);

// 3) Route cần đăng nhập
app.get("/me", { preHandler: requireAuth }, async (req) => {
  return { email: req.user!.email };
});

// 4) Đăng xuất -> xoá auth session
app.post("/auth/logout", { preHandler: requireAuth }, async (req) => {
  await redis.del(authKey(req.tokenHash!));
  return { ok: true };
});

// ───────────────────────── Start ─────────────────────────
app.addHook("onClose", async () => {
  await redis.quit();
});

app.listen({ port: PORT, host: "0.0.0.0" }).catch((err) => {
  app.log.error(err);
  process.exit(1);
});

