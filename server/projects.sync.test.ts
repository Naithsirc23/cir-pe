import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const onDuplicateKeyUpdate = vi.fn().mockResolvedValue(undefined);
  const values = vi.fn(() => ({ onDuplicateKeyUpdate }));
  const insert = vi.fn(() => ({ values }));
  return { database: { insert }, insert, values, onDuplicateKeyUpdate };
});

vi.mock("./db", () => ({ getDb: vi.fn().mockResolvedValue(mocks.database) }));

import { syncProjectsFromGitHub } from "./projects";

describe("syncProjectsFromGitHub", () => {
  it("crea o actualiza una fila de proyecto por cada repositorio sincronizado", async () => {
    const result = await syncProjectsFromGitHub(12, [
      {
        githubId: "182",
        name: "ELICONTABLE",
        fullName: "Naithsirc23/ELICONTABLE",
        description: "Gestión financiera",
        repositoryUrl: "https://github.com/Naithsirc23/ELICONTABLE",
        homepageUrl: null,
        language: "TypeScript",
        topics: ["finanzas"],
        visibility: "public",
        isArchived: false,
        isFork: false,
        githubCreatedAt: new Date("2026-01-01T00:00:00Z"),
        githubUpdatedAt: new Date("2026-02-01T00:00:00Z"),
        githubPushedAt: new Date("2026-02-02T00:00:00Z"),
      },
    ]);

    expect(result.synced).toBe(1);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    expect(mocks.values).toHaveBeenCalledWith(expect.objectContaining({
      ownerId: 12,
      githubId: "182",
      name: "ELICONTABLE",
      topics: JSON.stringify(["finanzas"]),
    }));
    expect(mocks.onDuplicateKeyUpdate).toHaveBeenCalledWith(expect.objectContaining({ set: expect.objectContaining({ name: "ELICONTABLE" }) }));
  });
});
