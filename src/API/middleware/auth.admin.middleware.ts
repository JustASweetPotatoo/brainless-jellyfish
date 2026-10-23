import { RedisClientType } from "redis";
import { getSession as getAdminSession } from "../services/auth.service";
import { FastifyRequest } from "fastify";

const ADMIN_SESSION_COOKIE = "admin_session=";

function getAdminSessionToken(request: FastifyRequest): string | undefined {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(ADMIN_SESSION_COOKIE));

  return cookie?.slice(ADMIN_SESSION_COOKIE.length);
}

export async function requireAuthAdmin(req: FastifyRequest, redis: RedisClientType) {
  const token = getAdminSessionToken(req);
  const session = await getAdminSession(token ?? "", redis);

  return {
    authenticated: !!session,
    session: session,
  };
}
