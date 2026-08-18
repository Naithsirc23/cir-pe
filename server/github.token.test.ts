import { describe, expect, it } from "vitest";

describe("GitHub token", () => {
  it("identifies an authenticated GitHub account", async () => {
    const token = process.env.GITHUB_TOKEN;

    expect(token, "GITHUB_TOKEN must be configured").toBeTruthy();

    const response = await fetch("https://api.github.com/user", {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.ok, `GitHub returned ${response.status}`).toBe(true);

    const account = (await response.json()) as { login?: string };
    expect(account.login).toBeTruthy();
  }, 15_000);
});
