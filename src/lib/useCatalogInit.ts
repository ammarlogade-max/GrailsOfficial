import { useEffect } from "react";
import { useCatalogStore } from "../store/catalogStore";

/** Loads the real catalog (products/categories/collections) once at app startup. No-ops in mock mode. */
export function useCatalogInit() {
  useEffect(() => {
    useCatalogStore.getState().fetchAll();
  }, []);
}
