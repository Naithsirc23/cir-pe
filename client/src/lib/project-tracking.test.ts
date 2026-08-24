import { describe, expect, it } from "vitest";
import { loadProjectTracking, normalizeProjectTracking, saveProjectTracking, type ProjectTrackingStorage } from "./project-tracking";

function createStorage(): ProjectTrackingStorage {
  const values = new Map<string, string>();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

describe("project tracking", () => {
  it("normalizes empty tasks and blockers as null", () => {
    expect(normalizeProjectTracking({ nextAction: "   ", blockerReason: "" })).toEqual({ nextAction: null, blockerReason: null });
  });

  it("trims action and blocker content before persisting", () => {
    expect(normalizeProjectTracking({ nextAction: "  Revisar PR  ", blockerReason: " Esperando acceso " })).toEqual({ nextAction: "Revisar PR", blockerReason: "Esperando acceso" });
  });

  it("recovers the saved task and blocker after a reload", () => {
    const storage = createStorage();
    saveProjectTracking(42, { nextAction: "Revisar despliegue", blockerReason: "Esperando DNS" }, storage);
    expect(loadProjectTracking(42, { nextAction: null, blockerReason: null }, storage)).toEqual({ nextAction: "Revisar despliegue", blockerReason: "Esperando DNS" });
  });

  it("uses the project data as a fallback when no local edit exists", () => {
    expect(loadProjectTracking(42, { nextAction: "Preparar demo", blockerReason: null }, createStorage())).toEqual({ nextAction: "Preparar demo", blockerReason: null });
  });
});
