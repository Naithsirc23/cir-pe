import { eq } from "drizzle-orm";
import { users } from "../drizzle/schema";
import { ENV } from "../server/_core/env";
import { getDb } from "../server/db";
import { fetchGitHubRepositories } from "../server/github";
import { syncProjectsFromGitHub } from "../server/projects";

const database = await getDb();
if (!database) throw new Error("La base de datos no está disponible.");

const owners = await database.select({ id: users.id }).from(users).where(eq(users.openId, ENV.ownerOpenId)).limit(1);
const owner = owners[0];
if (!owner) throw new Error("No se encontró el propietario del dashboard.");

const repositories = await fetchGitHubRepositories();
const result = await syncProjectsFromGitHub(owner.id, repositories);

console.log(`Sincronizados ${result.synced} repositorios para el propietario ${owner.id}.`);
