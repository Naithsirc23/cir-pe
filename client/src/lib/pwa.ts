export const PWA_MANIFEST_PATH = "/manifest.webmanifest";

export function shouldRegisterServiceWorker(environment: Pick<Window, "isSecureContext" | "navigator"> | undefined = typeof window === "undefined" ? undefined : window) {
  return Boolean(environment?.isSecureContext && "serviceWorker" in environment.navigator);
}

export function registerPwaServiceWorker() {
  if (!shouldRegisterServiceWorker()) return;
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, { once: true });
}
