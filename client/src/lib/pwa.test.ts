import { describe, expect, it } from "vitest";
import { PWA_MANIFEST_PATH, registerPwaServiceWorker, shouldRegisterServiceWorker } from "./pwa";

describe("PWA configuration", () => {
  it("uses the public manifest path", () => {
    expect(PWA_MANIFEST_PATH).toBe("/manifest.webmanifest");
  });

  it("registers only in secure browsers with service-worker support", () => {
    expect(shouldRegisterServiceWorker({ isSecureContext: true, navigator: { serviceWorker: {} } } as Window)).toBe(true);
    expect(shouldRegisterServiceWorker({ isSecureContext: false, navigator: { serviceWorker: {} } } as Window)).toBe(false);
  });

  it("keeps the update registration API available", () => {
    expect(registerPwaServiceWorker).toBeTypeOf("function");
  });
});
