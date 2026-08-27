import * as React from "react";

/**
 * El ancho no basta para decidir el shell: una ventana estrecha de Brave en
 * Linux sigue necesitando la experiencia de escritorio. El shell móvil se
 * reserva para pantallas táctiles sin cursor de precisión.
 */
export const MOBILE_MEDIA_QUERY = "(max-width: 700px) and (hover: none) and (pointer: coarse)";

export function matchesMobileShell(environment: Pick<Window, "matchMedia"> | undefined = typeof window === "undefined" ? undefined : window) {
  return Boolean(environment?.matchMedia(MOBILE_MEDIA_QUERY).matches);
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => matchesMobileShell());

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => {
      setIsMobile(mql.matches);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
