import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface NewsletterState {
  subscribed: boolean;
  loading: boolean;
  subscribe: (email: string) => Promise<{ success: boolean; message: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const useNewsletterStore = create<NewsletterState>()((set) => ({
  subscribed: false,
  loading: false,

  subscribe: async (email) => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      return { success: false, message: "Please enter a valid email address" };
    }
    if (!isSupabaseConfigured) {
      set({ subscribed: true });
      return { success: true, message: "Subscribed! (Demo mode — not actually saved anywhere.)" };
    }
    set({ loading: true });
    const { error } = await supabase.from("newsletter_subscribers").insert({ email: trimmed });
    set({ loading: false });
    if (error) {
      // Unique violation means they're already subscribed — treat as success, not an error.
      if (error.code === "23505") {
        set({ subscribed: true });
        return { success: true, message: "You're already on the list!" };
      }
      return { success: false, message: "Something went wrong. Please try again." };
    }
    set({ subscribed: true });
    return { success: true, message: "You're subscribed! Watch your inbox for drops and offers." };
  },
}));
