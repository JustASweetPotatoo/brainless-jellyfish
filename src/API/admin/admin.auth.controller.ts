import { FastifyReply, FastifyRequest } from "fastify";
import Controller from "../core/Controller";
import { Controller as ControllerRouter, Get, Post } from "../core/decorator/controller.decorator";
import {
  clearAuthOtp,
  deleteWebSession,
  requestAuthOtp,
  sendAuthOtp,
  verifyAuthOtp,
} from "../auth/auth.service";
import { getWebSession } from "./admin.auth.service";

const SESSION_COOKIE = "admin_session";
const ADMIN_OTP_RESPONSE = {
  message: "Nếu Gmail này được cấp quyền quản trị, mã đăng nhập sẽ được gửi đến hộp thư.",
};

function cookieToken(req: FastifyRequest): string | undefined {
  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`));
  return cookie ? decodeURIComponent(cookie.slice(SESSION_COOKIE.length + 1)) : undefined;
}

function cookieOptions(): string {
  const secure =
    process.env.DISCORD_OAUTH_COOKIE_SECURE === "true" ||
    process.env.DISCORD_REDIRECT_URI?.startsWith("https://");
  return `Path=/; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}

@ControllerRouter("/api/admin/auth")
export default class AdminController extends Controller {
  @Post("/request-token")
  async getOtpCode(req: FastifyRequest<{ Body: { email?: string } }>, rep: FastifyReply) {
    const email = req.body?.email?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return rep.code(400).send({ message: "Invalid email format" });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!adminEmail || !process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return rep.code(503).send({ message: "Server is not configured" });
    }

    if (email !== adminEmail) {
      return rep.code(202).send(ADMIN_OTP_RESPONSE);
    }

    const otpSession = await requestAuthOtp(email, this.redis);
    if (otpSession.status === "rate_limited") {
      return rep.code(429).send({ message: "Too many request" });
    }

    try {
      await sendAuthOtp(email, otpSession.otp);
    } catch (error) {
      await clearAuthOtp(email, this.redis);
      req.log.error({ err: error }, "Unable to send admin login email");
      return rep.code(502).send({ message: "Server internal error" });
    }

    return rep.code(202).send(ADMIN_OTP_RESPONSE);
  }

  @Post("/verify-token")
  async verifyOtpCode(
    req: FastifyRequest<{ Body: { email: string; code: string } }>,
    rep: FastifyReply,
  ) {
    const email = req.body.email;
    const otp = req.body.code;

    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (email !== adminEmail || !/^\d{6}$/.test(otp)) {
      return rep.code(401).send({ message: "Invalid credentials" });
    }

    const result = await verifyAuthOtp(email, otp, this.redis);
    if (result.status === "too_many_attempts") {
      return rep.code(429).send({ message: "Too many tries." });
    }

    if (result.status !== "verified") {
      return rep.code(401).send({ message: "Invalid or expired token." });
    }

    rep.header(
      "Set-Cookie",
      `${SESSION_COOKIE}=${encodeURIComponent(result.session.token)}; ${cookieOptions()}; Max-Age=${8 * 60 * 60}`,
    );

    return rep.code(200).send({ authenticated: true });
  }

  @Post("/logout")
  async logout(req: FastifyRequest, rep: FastifyReply) {
    const token = cookieToken(req);
    if (token) {
      await deleteWebSession(token, this.redis);
    }

    rep.header("Set-Cookie", `${SESSION_COOKIE}=; ${cookieOptions()}; Max-Age=0`);
    return rep.code(204).send();
  }

  @Get("/session")
  async getSession(req: FastifyRequest, reply: FastifyReply) {
    const token = cookieToken(req);
    if (!token) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const session = await getWebSession(token, this.redis);

    if (!session) {
      return reply.code(401).send({ message: "Invalid credentials" });
    }

    const email = session.user.email;
    return reply.code(200).send({
      user: {
        id: `admin:${email}`,
        username: email.split("@")[0],
        email,
        displayName: "Administrator",
      },
      expiresAt: session.expiresAt,
    });
  }
}
