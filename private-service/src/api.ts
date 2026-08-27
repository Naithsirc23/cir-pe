import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import type { PrivateStore } from "./store";

export type PrivateApiOptions = {
  store: PrivateStore;
  allowedOrigins: string[];
  writeEnabled?: boolean;
  writeCapability?: string;
  now?: () => Date;
};

function clampInteger(value: string | null, fallback: number, maximum: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, maximum) : fallback;
}

function corsHeaders(request: IncomingMessage, allowedOrigins: string[]): Record<string, string> {
  const origin = request.headers.origin;
  if (typeof origin !== "string" || !allowedOrigins.includes(origin)) return {};
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin", "Access-Control-Allow-Methods": "GET, OPTIONS, PATCH, PUT", "Access-Control-Allow-Headers": "Content-Type" };
}

function sendJson(response: ServerResponse, status: number, payload: unknown, headers: Record<string, string> = {}) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  response.end(JSON.stringify(payload));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 50_000) throw new Error("La solicitud excede el límite permitido.");
    chunks.push(buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function toCategoryId(value: unknown): number | null | undefined {
  if (value === null) return null;
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function hasWriteCapability(request: IncomingMessage, capability: string): boolean {
  const raw = request.headers["tailscale-app-capabilities"];
  if (typeof raw !== "string") return false;
  try {
    const capabilities = JSON.parse(raw) as Record<string, unknown>;
    return Array.isArray(capabilities[capability]) && capabilities[capability].length > 0;
  } catch {
    return false;
  }
}

export function createPrivateApi(options: PrivateApiOptions): Server {
  const now = options.now ?? (() => new Date());
  const writeEnabled = options.writeEnabled ?? false;
  const writeCapability = options.writeCapability ?? "cir.pe/cir-projects-organize";

  return createServer(async (request, response) => {
    const headers = corsHeaders(request, options.allowedOrigins);
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, headers);
        response.end();
        return;
      }

      const isWrite = request.method === "PATCH" || request.method === "PUT";
      const origin = request.headers.origin;
      if (isWrite && (!writeEnabled || typeof origin !== "string" || !options.allowedOrigins.includes(origin) || !hasWriteCapability(request, writeCapability))) {
        sendJson(response, 403, { error: "write_forbidden", message: "Las escrituras privadas requieren una capacidad de Tailscale, la PWA autorizada y CIR_PRIVATE_WRITE_ENABLED=true." }, headers);
        return;
      }
      if (request.method !== "GET" && !isWrite) {
        sendJson(response, 405, { error: "read_only", message: "La API privada solo permite GET." }, { ...headers, Allow: "GET, OPTIONS" });
        return;
      }

      const url = new URL(request.url ?? "/", "http://127.0.0.1");
      if (url.pathname === "/api/health") {
        sendJson(response, 200, { service: "cir-private-api", now: now().toISOString(), ...options.store.health(writeEnabled) }, headers);
        return;
      }
      if (url.pathname === "/api/categories") {
        sendJson(response, 200, { readOnlyMode: !writeEnabled, categories: options.store.listCategories() }, headers);
        return;
      }
      if (url.pathname === "/api/projects") {
        const limit = clampInteger(url.searchParams.get("limit"), 50, 100) || 50;
        const offset = clampInteger(url.searchParams.get("offset"), 0, 100_000);
        const { projects, total } = options.store.listProjects(limit, offset);
        sendJson(response, 200, { total, limit, offset, projects, ...options.store.health(writeEnabled) }, headers);
        return;
      }
      if (request.method === "PATCH" && url.pathname.match(/^\/api\/projects\/[^/]+$/)) {
        const githubId = decodeURIComponent(url.pathname.split("/").pop()!);
        const body = await readJson(request) as { categoryId?: unknown };
        const categoryId = toCategoryId(body.categoryId);
        if (categoryId === undefined) throw new Error("categoryId debe ser un entero positivo o null.");
        options.store.assignProjectCategory(githubId, categoryId);
        sendJson(response, 200, { ok: true, readOnlyMode: false, project: options.store.getProject(githubId) }, headers);
        return;
      }
      if (request.method === "PUT" && url.pathname === "/api/organization/projects") {
        const body = await readJson(request) as { projects?: unknown };
        if (!Array.isArray(body.projects) || body.projects.length > 100) throw new Error("projects debe ser una lista de hasta 100 elementos.");
        const updates = body.projects.map(project => {
          const value = project as { githubId?: unknown; categoryId?: unknown; position?: unknown };
          const categoryId = toCategoryId(value.categoryId);
          if (typeof value.githubId !== "string" || !value.githubId || categoryId === undefined || typeof value.position !== "number" || !Number.isInteger(value.position) || value.position < 0) throw new Error("El orden de proyectos no es válido.");
          return { githubId: value.githubId, categoryId, position: value.position };
        });
        options.store.reorderProjects(updates);
        sendJson(response, 200, { ok: true, readOnlyMode: false }, headers);
        return;
      }
      if (request.method === "PUT" && url.pathname === "/api/organization/categories/order") {
        const body = await readJson(request) as { categoryIds?: unknown };
        if (!Array.isArray(body.categoryIds) || body.categoryIds.length > 100 || body.categoryIds.some(id => !Number.isInteger(id))) throw new Error("categoryIds debe ser una lista de enteros.");
        options.store.reorderCategories(body.categoryIds as number[]);
        sendJson(response, 200, { ok: true, readOnlyMode: false }, headers);
        return;
      }

      const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
      if (projectMatch) {
        const project = options.store.getProject(decodeURIComponent(projectMatch[1]));
        if (!project) {
          sendJson(response, 404, { error: "not_found" }, headers);
          return;
        }
        sendJson(response, 200, { readOnlyMode: !writeEnabled, project }, headers);
        return;
      }
      sendJson(response, 404, { error: "not_found" }, headers);
    } catch (error) {
      sendJson(response, 400, { error: "invalid_request", message: error instanceof Error ? error.message : "Solicitud no válida." }, headers);
    }
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
