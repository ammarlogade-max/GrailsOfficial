import { useEffect } from "react";
import { useCMSStore } from "../store/cmsStore";

/**
 * Applies brand colors as CSS custom properties so theme changes in
 * Website Settings take effect instantly, everywhere, without a redeploy.
 *
 * Does NOT touch document.title or the meta description — that's
 * useSEO's job on a per-page basis. This hook lives at the App root and
 * never unmounts, so if it also wrote the title, it would run *after*
 * every page's own useSEO effect (child effects fire before parent
 * effects on mount) and silently stomp every page back to the site
 * default title. Keep this hook single-purpose.
 */
export function useThemeSync() {
  const settings = useCMSStore((s) => s.settings);

  useEffect(() => {
    const root = document.documentElement.style;
    root.setProperty("--color-primary", settings.primaryColor);
    root.setProperty("--color-accent", settings.primaryColor);
    root.setProperty("--color-secondary", settings.secondaryColor);
    root.setProperty("--color-button", settings.buttonColor);
  }, [settings]);
}
