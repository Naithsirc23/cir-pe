import { readFile, writeFile } from "node:fs/promises";

const sourcePath = "/home/ubuntu/cir-pe/.github-repositories.json";
const targetPath = "/home/ubuntu/cir-pe/github-repositories.clean.json";

const raw = await readFile(sourcePath, "utf8");
const withoutAnsi = raw.replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
const repositories = JSON.parse(withoutAnsi);

await writeFile(targetPath, `${JSON.stringify(repositories, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      count: repositories.length,
      names: repositories.map((repository) => repository.name),
    },
    null,
    2,
  ),
);
