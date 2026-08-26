import { PrivateStore } from "./store";
import { syncGitHubProjects } from "./github-sync";
import { readFileSync } from "node:fs";
import type { OrganizationConfig } from "./store";

const command = process.argv[2];
const databasePath = process.env.CIR_PRIVATE_DB_PATH ?? "private-service/data/cir-projects.sqlite";
const organizationPath = process.env.CIR_PRIVATE_ORGANIZATION_PATH;
async function main() {
  const store = new PrivateStore(databasePath);
  try {
    if (command === "init") {
      console.info(`Base SQLite preparada en ${databasePath}.`);
    } else if (command === "sync-github") {
      const count = await syncGitHubProjects(store);
      console.info(`Sincronizados ${count} repositorios de GitHub.`);
    } else if (command === "apply-organization") {
      if (!organizationPath) throw new Error("CIR_PRIVATE_ORGANIZATION_PATH debe indicar un archivo JSON local.");
      const config = JSON.parse(readFileSync(organizationPath, "utf8")) as OrganizationConfig;
      if (!Array.isArray(config.categories) || !Array.isArray(config.projects)) {
        throw new Error("El archivo de organización debe incluir arrays categories y projects.");
      }
      store.applyOrganization(config);
      console.info(`Organización aplicada desde ${organizationPath}.`);
    } else {
      console.error("Uso: pnpm private:db:init | pnpm private:db:sync-github | pnpm private:db:apply-organization");
      process.exitCode = 1;
    }
  } finally {
    store.close();
  }
}

void main();
