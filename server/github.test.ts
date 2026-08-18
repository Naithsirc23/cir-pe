import { describe, expect, it } from "vitest";
import { normalizeGitHubRepository } from "./github";

describe("normalizeGitHubRepository", () => {
  it("conserva los campos que el dashboard necesita de la API de GitHub", () => {
    const repository = normalizeGitHubRepository({
      id: 42,
      name: "KRONOS",
      full_name: "Naithsirc23/KRONOS",
      description: "Control de proyectos",
      html_url: "https://github.com/Naithsirc23/KRONOS",
      homepage: "https://kronos.example.com",
      language: "TypeScript",
      topics: ["productividad"],
      private: true,
      archived: false,
      fork: false,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-02-01T00:00:00Z",
      pushed_at: "2026-02-02T00:00:00Z",
      owner: { login: "Naithsirc23" },
    });

    expect(repository).toMatchObject({
      githubId: "42",
      name: "KRONOS",
      visibility: "private",
      topics: ["productividad"],
      repositoryUrl: "https://github.com/Naithsirc23/KRONOS",
    });
    expect(repository.githubPushedAt).toEqual(new Date("2026-02-02T00:00:00Z"));
  });
});
