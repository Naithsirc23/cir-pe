import { describe, expect, it } from "vitest";
import { MOBILE_MEDIA_QUERY, matchesMobileShell } from "./useMobile";

describe("matchesMobileShell", () => {
  it("utiliza un media query que exige pantalla estrecha y entrada táctil", () => {
    expect(MOBILE_MEDIA_QUERY).toContain("max-width: 700px");
    expect(MOBILE_MEDIA_QUERY).toContain("pointer: coarse");
  });

  it("distingue un shell móvil de un navegador de escritorio", () => {
    const mobile = { matchMedia: () => ({ matches: true }) } as unknown as Window;
    const desktop = { matchMedia: () => ({ matches: false }) } as unknown as Window;
    expect(matchesMobileShell(mobile)).toBe(true);
    expect(matchesMobileShell(desktop)).toBe(false);
  });
});
