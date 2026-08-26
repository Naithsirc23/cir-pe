import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { PrivateStore } from "./store";

export type PrivateApiOptions = {
  store: PrivateStore;
  allowedOrigins: string[];
  now?: () => Date;
};

function clampInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function corsHeaders(request: IncomingMessage, allowedOrigins: string[]): Record<string, string> {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || !allowedOrigins.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

function sendJson(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(payload));
}

export function createPrivateApi(options: PrivateApiOptions): Server {
  const now = options.now ?? (() => new Date());

  return createServer((request, response) => {
    const headers = corsHeaders(request, options.allowedOrigins);
    if (request.method === "OPTIONS") {
      response.writeHead(204, headers);
      response.end();
      return;
    }

    if (request.method !== "GET") {
      sendJson(response, 405, { error: "read_only", message: "La API privada solo permite GET." }, { ...headers, Allow: "GET, OPTIONS" });
      return;
    }

    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    if (url.pathname === "/api/health") {
      sendJson(response, 200, { service: "cir-private-api", now: now().toISOString(), ...options.store.health() }, headers);
      return;
    }

    if (url.pathname === "/api/categories") {
      sendJson(response, 200, { readOnlyMode: true, categories: options.store.listCategories() }, headers);
      return;
    }

    if (url.pathname === "/api/projects") {
      const limit = clampInteger(url.searchParams.get("limit"), 50, 100) || 50;
      const offset = clampInteger(url.searchParams.get("offset"), 0, 100_000);
      const { projects, total } = options.store.listProjects(limit, offset);
      sendJson(response, 200, { total, limit, offset, projects, ...options.store.health() }, headers);
      return;
    }

    const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (projectMatch) {
      const project = options.store.getProject(decodeURIComponent(projectMatch[1]));
      if (!project) {
        sendJson(response, 404, { error: "not_found" }, headers);
        return;
      }
      sendJson(response, 200, { readOnlyMode: true, project }, headers);
      return;
    }

    sendJson(response, 404, { error: "not_found" }, headers);
  });
}

export async function listenPrivateApi(server: Server, port: number) {
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve();
    });
  });
}
