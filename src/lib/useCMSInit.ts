import { useEffect } from "react";
import { useCMSStore } from "../store/cmsStore";

/** Loads the real homepage/CMS content once at app startup. No-ops in mock mode. */
export function useCMSInit() {
  useEffect(() => {
    useCMSStore.getState().fetchAll();
  }, []);
}
