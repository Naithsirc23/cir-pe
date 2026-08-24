import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DashboardProject } from "@/lib/project-filters";
import ProjectCard from "./ProjectCard";

const mutate = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: { projects: { update: { useMutation: () => ({ mutate, isPending: false }) } } },
}));
vi.mock("@/components/ui/progress", () => ({ Progress: () => <div data-testid="progress" /> }));
vi.mock("wouter", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));

const project: DashboardProject = {
  id: 41, name: "KRONOS", description: null, categoryId: null, categoryName: null, categoryColor: null,
  status: "activo", priority: "media", phase: "Desarrollo", progress: 35, blockerReason: null,
  language: "TypeScript", topics: [], repositoryUrl: "https://github.com/Naithsirc23/KRONOS", homepageUrl: null,
  demoUrl: null, documentationUrl: null, nextAction: null, notes: null, milestoneAt: null,
  githubPushedAt: new Date(), githubUpdatedAt: new Date(), lastSyncedAt: new Date(), visibility: "public",
};

describe("ProjectCard tracking", () => {
  beforeEach(() => {
    mutate.mockReset();
    window.localStorage.clear();
  });

  it("edits and saves tracking with local fallback", () => {
    render(<ProjectCard project={project} />);

    fireEvent.click(screen.getByLabelText("Editar seguimiento de KRONOS"));
    fireEvent.change(screen.getByLabelText("Siguiente tarea"), { target: { value: "Revisar demo" } });
    fireEvent.change(screen.getByLabelText("Motivo de bloqueo"), { target: { value: "Esperando acceso" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByText("Revisar demo")).toBeTruthy();
    expect(screen.getByText("Esperando acceso")).toBeTruthy();
    expect(mutate).toHaveBeenCalledWith(
      { id: 41, nextAction: "Revisar demo", blockerReason: "Esperando acceso" },
      expect.objectContaining({ onError: expect.any(Function), onSuccess: expect.any(Function) }),
    );
    expect(JSON.parse(window.localStorage.getItem("cir-project-tracking:41") ?? "{}")).toEqual({ nextAction: "Revisar demo", blockerReason: "Esperando acceso" });
  });
});
