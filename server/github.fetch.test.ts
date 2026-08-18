import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchGitHubRepositories } from "./github";

function githubRepository(id: number, owner = "Naithsirc23") {
  return {
    id,
    name: `repo-${id}`,
    full_name: `${owner}/repo-${id}`,
    description: null,
    html_url: `https://github.com/${owner}/repo-${id}`,
    homepage: null,
    language: "TypeScript",
    topics: ["dashboard"],
    private: false,
    archived: false,
    fork: false,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    pushed_at: "2026-02-02T00:00:00Z",
    owner: { login: owner },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchGitHubRepositories", () => {
  it("autentica, recorre las páginas y conserva solo repositorios de Naithsirc23", async () => {
    const firstPage = Array.from({ length: 99 }, (_, index) => githubRepository(index + 1));
    firstPage.push(githubRepository(999, "other-owner"));
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ login: "Naithsirc23" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(firstPage), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const repositories = await fetchGitHubRepositories();

    expect(repositories).toHaveLength(99);
    expect(repositories[0]).toMatchObject({ githubId: "1", name: "repo-1", visibility: "public" });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain("/user/repos?affiliation=owner");
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toMatch(/^Bearer .+/);
  });

  it("propaga una respuesta no satisfactoria de GitHub con contexto", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Servicio no disponible", { status: 503 })));

    await expect(fetchGitHubRepositories()).rejects.toThrow("GitHub API respondió 503");
  });
});
