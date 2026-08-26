import { createPrivateApi, listenPrivateApi } from "./api";
import { PrivateStore } from "./store";

const port = Number.parseInt(process.env.CIR_PRIVATE_PORT ?? "8002", 10);
const databasePath = process.env.CIR_PRIVATE_DB_PATH ?? "private-service/data/cir-projects.sqlite";
const allowedOrigins = (process.env.CIR_PRIVATE_ALLOWED_ORIGINS ?? "https://cir-projects-dashboard.vercel.app")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("CIR_PRIVATE_PORT debe ser un puerto válido entre 1024 y 65535.");
}

async function main() {
  const store = new PrivateStore(databasePath);
  const server = createPrivateApi({ store, allowedOrigins });

  await listenPrivateApi(server, port);
  console.info(`[cir-private-api] escuchando solo en http://127.0.0.1:${port}`);

  function shutdown(signal: string) {
    console.info(`[cir-private-api] recibiendo ${signal}; cerrando.`);
    server.close(() => {
      store.close();
      process.exit(0);
    });
  }

  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}

void main();
