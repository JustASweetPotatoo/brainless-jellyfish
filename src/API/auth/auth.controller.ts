import { FastifyReply, FastifyRequest } from "fastify";
import Controller from "../core/Controller";
import { Controller as ControllerRoute, Get } from "../core/decorator/controller.decorator";
import {
  completeDiscordOAuth,
  createDiscordOAuthUrl,
} from "./auth.service";

const SESSION_COOKIE = "suwa_session";
const ADMIN_OTP_RESPONSE = {
  message: "Nếu Gmail này được cấp quyền quản trị, mã đăng nhập sẽ được gửi đến hộp thư.",
};

function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? "http://127.0.0.1:3000";
}

function cookieToken(request: FastifyRequest): string | undefined {
  const cookie = request.headers.cookie
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

@ControllerRoute("/api/auth")
export default class AuthController extends Controller {
  @Get("/discord/start")
  async startDiscordLogin(
    request: FastifyRequest<{ Querystring: { returnTo?: string } }>,
    reply: FastifyReply,
  ) {
    try {
      const url = await createDiscordOAuthUrl(request.query.returnTo ?? "/dashboard", this.redis);
      return reply.redirect(url);
    } catch (error) {
      request.log.error({ err: error }, "Unable to start Discord OAuth");
      return reply.code(503).send({ message: "Discord OAuth chưa được cấu hình." });
    }
  }

  @Get("/discord/callback")
  async completeDiscordLogin(
    request: FastifyRequest<{ Querystring: { code?: string; state?: string; error?: string } }>,
    reply: FastifyReply,
  ) {
    if (request.query.error || !request.query.code || !request.query.state) {
      return reply.redirect(new URL("/login?error=discord_oauth", webOrigin()).toString());
    }

    try {
      const result = await completeDiscordOAuth(
        request.query.code,
        request.query.state,
        this.redis,
      );
      reply.header(
        "Set-Cookie",
        `${SESSION_COOKIE}=${encodeURIComponent(result.session.token)}; ${cookieOptions()}; Max-Age=${8 * 60 * 60}`,
      );
      return reply.redirect(new URL(result.returnTo, webOrigin()).toString());
    } catch (error) {
      request.log.error({ err: error }, "Discord OAuth callback failed");
      return reply.redirect(new URL("/login?error=discord_oauth", webOrigin()).toString());
    }
  }
}

