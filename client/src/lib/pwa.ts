export const PWA_MANIFEST_PATH = "/manifest.webmanifest";

export function shouldRegisterServiceWorker(environment: Pick<Window, "isSecureContext" | "navigator"> | undefined = typeof window === "undefined" ? undefined : window) {
  return Boolean(environment?.isSecureContext && "serviceWorker" in environment.navigator);
}

export function registerPwaServiceWorker() {
  if (!shouldRegisterServiceWorker()) return;
  window.addEventListener("load", () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshed = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (hadController && !refreshed) {
        refreshed = true;
        window.location.reload();
      }
    });
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then(registration => {
      void registration.update();
    });
  }, { once: true });
}
