import { beforeEach, describe, expect, it, vi } from "vitest";

const where = vi.fn().mockResolvedValue(undefined);
const set = vi.fn(() => ({ where }));
const update = vi.fn(() => ({ set }));
const getDb = vi.fn(async () => ({ update }));

vi.mock("./db", () => ({ getDb }));
vi.mock("drizzle-orm", () => ({
  and: vi.fn(),
  desc: vi.fn(),
  eq: vi.fn(),
  getTableColumns: vi.fn(),
  isNull: vi.fn(),
}));

describe("project tracking persistence", () => {
  beforeEach(() => vi.clearAllMocks());

  it("writes next action and blocker reason in the project update", async () => {
    const { updateProject } = await import("./projects");

    await updateProject(7, 19, { nextAction: "Revisar la demo", blockerReason: "Esperando acceso al entorno" });

    expect(update).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ nextAction: "Revisar la demo", blockerReason: "Esperando acceso al entorno" });
    expect(where).toHaveBeenCalledTimes(1);
  });
});
