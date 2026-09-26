import { createHash, randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";

import { initialModules } from "./src/components/dashboard/core/moduleData";
import { servers } from "./src/components/dashboard/mock/dashboardData";
import type { DashboardStats } from "./src/api/dashboardApi.ts";
import type { BotModule } from "./src/components/dashboard/core/types.ts";

const modulesByServer = new Map<string, BotModule[]>(
  servers.map((server, index) => [
    server.id,
    initialModules.map((module, moduleIndex) => ({
      ...module,
      enabled: index === 0 ? module.enabled : module.enabled !== ((index + moduleIndex) % 2 === 0),
    })),
  ]),
);

const memberSeeds = [8429, 3182, 1906, 764];
const messageSeeds = [3691, 1428, 872, 356];
const channelSets = [
  ["# general", "# media", "# gaming", "# bot-commands"],
  ["# lounge", "# events", "# art-share", "# commands"],
  ["# showcase", "# support", "# pixel-art", "# bot-zone"],
  ["# engineering", "# questions", "# releases", "# automation"],
];
const statsByServer = new Map<string, DashboardStats>(
  servers.map((server, index) => {
    const scale = 1 - index * 0.17;
    const memberCount = memberSeeds[index];
    const messagesToday = messageSeeds[index];
    const stats: DashboardStats = {
      updatedAt: new Date().toISOString(),
      memberCount,
      onlineCount: Math.round(memberCount * [0.152, 0.184, 0.137, 0.221][index]),
      messagesToday,
      messagesTotal: Math.round([78200, 36400, 21900, 9700][index]),
      newMembers: [642, 318, 204, 96][index],
      voiceHoursToday: [124, 76, 43, 28][index],
      voiceHoursTotal: [1862, 924, 517, 302][index],
      memberGrowthPercent: [12.5, 18.2, 9.8, 15.6][index],
      onlinePercent: [8.2, 11.4, 7.6, 13.1][index],
      messageGrowthPercent: [24.8, 16.3, 31.2, 12.7][index],
      voiceGrowthPercent: [6.4, 12.1, 4.8, 19.3][index],
      memberGrowth: [28, 43, 35, 57, 46, 74, 56, 91, 64, 48, 76, 99, 67, 84].map(
        (value, pointIndex) =>
          Math.max(12, Math.round(value * scale + ((pointIndex + index) % 4) * 3)),
      ),
      dailyActivity: [
        { label: "T2", messages: 820, members: 18 },
        { label: "T3", messages: 1130, members: 27 },
        { label: "T4", messages: 940, members: 21 },
        { label: "T5", messages: 1540, members: 35 },
        { label: "T6", messages: 1280, members: 31 },
        { label: "T7", messages: 1870, members: 46 },
        { label: "CN", messages: 1620, members: 39 },
      ].map((point, pointIndex) => ({
        ...point,
        messages: Math.round(point.messages * scale + index * 23 + pointIndex * index * 7),
        members: Math.max(2, Math.round(point.members * scale + ((pointIndex + index) % 3))),
      })),
      topChannels: channelSets[index].map((name, channelIndex) => ({
        name,
        messages: Math.round([12482, 8761, 6204, 4390][channelIndex] * scale),
        share: [92, 68, 51, 37][channelIndex],
      })),
      recentActivities: [
        {
          title: `${["Moonlight", "Hana", "PixelKid", "Linus"][index]} đã tham gia máy chủ`,
          meta: "2 phút trước · #welcome",
          tone: "purple",
          icon: "✦",
        },
        {
          title: "AutoMod đã xoá một tin nhắn",
          meta: "8 phút trước · #general",
          tone: "orange",
          icon: "⌁",
        },
        {
          title: `${["Dino", "Sora", "Mika", "An"][index]} đạt cấp độ ${24 - index * 3}`,
          meta: "15 phút trước · Level & XP",
          tone: "blue",
          icon: "↗",
        },
      ],
    };
    return [server.id, stats];
  }),
);

interface MockApiConfig {
  discordClientId?: string;
  discordClientSecret?: string;
  discordRedirectUri?: string;
  webOrigin?: string;
  secureCookie?: boolean;
}

interface DiscordOAuthState {
  verifier: string;
  returnTo: string;
  expiresAt: number;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  global_name?: string | null;
  email?: string | null;
  avatar?: string | null;
}

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
}

const SESSION_COOKIE = "suwa_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const oauthStates = new Map<string, DiscordOAuthState>();
const authSessions = new Map<string, { user: DiscordUserResponse; expiresAt: number }>();

function getCookie(request: IncomingMessage, name: string): string | null {
  const cookie = request.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : null;
}

function redirect(response: ServerResponse, location: string, cookie?: string) {
  response.statusCode = 302;
  response.setHeader("Location", location);
  if (cookie) response.setHeader("Set-Cookie", cookie);
  response.end();
}

function safeReturnPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/dashboard";
  }
  return path;
}

function sendJson(response: ServerResponse, status: number, data: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(data));
}

function readJson(request: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk: string) => {
      body += chunk;
      if (body.length > 16_384) reject(new Error("Request body too large"));
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

export function mockApiPlugin(config: MockApiConfig = {}): Plugin {
  return {
    name: "temporary-dashboard-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const url = new URL(request.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        void (async () => {
          const path = url.pathname.slice("/api".length);
          const forwardedProto = request.headers["x-forwarded-proto"];
          const requestProtocol =
            (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)?.split(",")[0] ??
            "http";
          const requestOrigin = `${requestProtocol}://${request.headers.host ?? "127.0.0.1"}`;
          const webOrigin =
            config.webOrigin ??
            (config.discordRedirectUri ? new URL(config.discordRedirectUri).origin : requestOrigin);

          if (request.method === "GET" && path === "/auth/discord/start") {
            if (
              !config.discordClientId ||
              !config.discordClientSecret ||
              !config.discordRedirectUri
            ) {
              redirect(
                response,
                new URL("/login?error=oauth_not_configured", webOrigin).toString(),
              );
              return;
            }

            const now = Date.now();
            for (const [state, value] of oauthStates) {
              if (value.expiresAt <= now) oauthStates.delete(state);
            }

            const state = randomBytes(32).toString("base64url");
            const verifier = randomBytes(32).toString("base64url");
            const challenge = createHash("sha256").update(verifier).digest("base64url");
            oauthStates.set(state, {
              verifier,
              returnTo: safeReturnPath(url.searchParams.get("returnTo")),
              expiresAt: now + OAUTH_STATE_TTL_MS,
            });

            const authorizationUrl = new URL("https://discord.com/oauth2/authorize");
            authorizationUrl.searchParams.set("client_id", config.discordClientId);
            authorizationUrl.searchParams.set("response_type", "code");
            authorizationUrl.searchParams.set("redirect_uri", config.discordRedirectUri);
            authorizationUrl.searchParams.set("scope", "identify email");
            authorizationUrl.searchParams.set("state", state);
            authorizationUrl.searchParams.set("code_challenge", challenge);
            authorizationUrl.searchParams.set("code_challenge_method", "S256");
            redirect(response, authorizationUrl.toString());
            return;
          }

          if (request.method === "GET" && path === "/auth/discord/callback") {
            const state = url.searchParams.get("state");
            const savedState = state ? oauthStates.get(state) : undefined;
            if (!state || !savedState || savedState.expiresAt <= Date.now()) {
              if (state) oauthStates.delete(state);
              sendJson(response, 400, { message: "OAuth state không hợp lệ hoặc đã hết hạn." });
              return;
            }
            oauthStates.delete(state);

            if (url.searchParams.has("error") || !url.searchParams.get("code")) {
              redirect(response, new URL("/login?error=discord_oauth", webOrigin).toString());
              return;
            }

            if (
              !config.discordClientId ||
              !config.discordClientSecret ||
              !config.discordRedirectUri
            ) {
              sendJson(response, 503, { message: "Discord OAuth chưa được cấu hình." });
              return;
            }

            const tokenBody = new URLSearchParams({
              client_id: config.discordClientId,
              client_secret: config.discordClientSecret,
              grant_type: "authorization_code",
              code: url.searchParams.get("code")!,
              redirect_uri: config.discordRedirectUri,
              code_verifier: savedState.verifier,
            });
            const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: tokenBody,
            });
            if (!tokenResponse.ok) {
              redirect(response, new URL("/login?error=discord_oauth", webOrigin).toString());
              return;
            }

            const token = (await tokenResponse.json()) as DiscordTokenResponse;
            const userResponse = await fetch("https://discord.com/api/users/@me", {
              headers: { Authorization: `${token.token_type} ${token.access_token}` },
            });
            if (!userResponse.ok) {
              redirect(response, new URL("/login?error=discord_oauth", webOrigin).toString());
              return;
            }

            const user = (await userResponse.json()) as DiscordUserResponse;
            const sessionId = randomBytes(32).toString("base64url");
            const expiresAt = Date.now() + SESSION_TTL_MS;
            authSessions.set(sessionId, { user, expiresAt });
            const secure = config.secureCookie || config.discordRedirectUri.startsWith("https://");
            const cookie = `${SESSION_COOKIE}=${sessionId}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}${secure ? "; Secure" : ""}`;
            redirect(response, new URL(savedState.returnTo, webOrigin).toString(), cookie);
            return;
          }

          if (request.method === "GET" && path === "/auth/session") {
            const sessionId = getCookie(request, SESSION_COOKIE);
            const session = sessionId ? authSessions.get(sessionId) : undefined;
            if (!session || session.expiresAt <= Date.now()) {
              if (sessionId) authSessions.delete(sessionId);
              sendJson(response, 401, { message: "Chưa đăng nhập" });
              return;
            }
            const { user } = session;
            const avatar = user.avatar
              ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${user.avatar.startsWith("a_") ? "gif" : "png"}`
              : undefined;
            sendJson(response, 200, {
              user: {
                id: user.id,
                username: user.username,
                email: user.email ?? "",
                displayName: user.global_name ?? user.username,
                avatar,
              },
              expiresAt: session.expiresAt,
            });
            return;
          }

          if (request.method === "POST" && path === "/auth/logout") {
            const sessionId = getCookie(request, SESSION_COOKIE);
            if (sessionId) authSessions.delete(sessionId);
            const secure = config.secureCookie || config.discordRedirectUri?.startsWith("https://");
            response.statusCode = 204;
            response.setHeader(
              "Set-Cookie",
              `${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure ? "; Secure" : ""}`,
            );
            response.end();
            return;
          }

          if (request.method === "GET" && path === "/health") {
            sendJson(response, 200, { status: "ok", service: "temporary-dashboard-api" });
            return;
          }

          if (request.method === "GET" && path === "/servers") {
            await delay(180);
            sendJson(response, 200, servers);
            return;
          }

          const statsRoute = path.match(/^\/servers\/([^/]+)\/stats$/);
          if (statsRoute && request.method === "GET") {
            const serverId = decodeURIComponent(statsRoute[1]);
            const stats = statsByServer.get(serverId);
            await delay(180);
            if (!stats) {
              sendJson(response, 404, { message: "Server không tồn tại" });
              return;
            }
            stats.messagesToday += 7 + servers.findIndex((server) => server.id === serverId) * 3;
            stats.messagesTotal += 7 + servers.findIndex((server) => server.id === serverId) * 3;
            stats.updatedAt = new Date().toISOString();
            sendJson(response, 200, stats);
            return;
          }

          const modulesRoute = path.match(/^\/servers\/([^/]+)\/modules$/);
          if (modulesRoute && request.method === "GET") {
            const serverId = decodeURIComponent(modulesRoute[1]);
            const modules = modulesByServer.get(serverId);
            await delay(220);
            if (!modules) {
              sendJson(response, 404, { message: "Server không tồn tại" });
              return;
            }
            sendJson(response, 200, modules);
            return;
          }

          const moduleRoute = path.match(/^\/servers\/([^/]+)\/modules\/([^/]+)$/);
          if (moduleRoute && request.method === "PATCH") {
            const serverId = decodeURIComponent(moduleRoute[1]);
            const moduleId = decodeURIComponent(moduleRoute[2]);
            const modules = modulesByServer.get(serverId);
            if (!modules) {
              sendJson(response, 404, { message: "Server không tồn tại" });
              return;
            }

            const body = await readJson(request);
            if (
              !body ||
              typeof body !== "object" ||
              !("enabled" in body) ||
              typeof body.enabled !== "boolean"
            ) {
              sendJson(response, 400, { message: "enabled phải là boolean" });
              return;
            }

            const target = modules.find((module) => module.id === moduleId);
            if (!target) {
              sendJson(response, 404, { message: "Module không tồn tại" });
              return;
            }

            await delay(350);
            target.enabled = body.enabled;
            sendJson(response, 200, target);
            return;
          }

          sendJson(response, 404, { message: "API route không tồn tại" });
        })().catch((error: unknown) => {
          if (response.headersSent) return;
          sendJson(response, 500, {
            message: error instanceof Error ? error.message : "Lỗi mock API",
          });
        });
      });
    },
  };
}
