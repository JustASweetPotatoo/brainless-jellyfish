import { FastifyRequest } from "fastify";
import { RedisClientType } from "redis";

export async function requireAuth(req: FastifyRequest, redis: RedisClientType) {
  return {
    authenticated: false,
    session: undefined,
  };
}
