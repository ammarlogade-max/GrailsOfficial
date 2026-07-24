import { useEffect } from "react";
import { useAuthStore, useAdminAuthStore } from "../store/authStore";

/** Restores/subscribes to the real Supabase session once at app startup. No-ops in mock mode. */
export function useAuthInit() {
  useEffect(() => {
    useAuthStore.getState().init();
    useAdminAuthStore.getState().init();
  }, []);
}
