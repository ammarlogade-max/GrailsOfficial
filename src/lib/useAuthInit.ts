import { useEffect } from "react";
import { useAuthStore, useAdminAuthStore } from "../store/authStore";

/** Restores/subscribes to the real Supabase session once at app startup. */
export function useAuthInit() {
  useEffect(() => {
    useAuthStore.getState().init();
    useAdminAuthStore.getState().init();
  }, []);
}
