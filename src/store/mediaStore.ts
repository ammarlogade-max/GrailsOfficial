import { create } from "zustand";
import type { MediaAsset } from "../data/types";
import { supabase } from "../lib/supabase";
import { compressImage } from "../lib/imageCompression";

interface MediaState {
  assets: MediaAsset[];
  loading: boolean;
  uploading: boolean;
  loaded: boolean;
  fetchAll: () => Promise<void>;
  /** Uploads a real file to Supabase Storage (media bucket) and records it in media_assets. */
  uploadFile: (file: File, folder: MediaAsset["folder"]) => Promise<MediaAsset>;
  deleteAsset: (id: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAsset(row: any): MediaAsset {
  return {
    id: row.id,
    fileName: row.file_name,
    folder: row.folder,
    fileType: row.file_type,
    altText: row.alt_text || "",
    photo: row.storage_path,
    uploadedAt: row.uploaded_at,
    fileSize: row.file_size || 0,
  };
}

function safeStorageFileName(name: string, type: string) {
  const fallbackExtension = type.split("/")[1]?.split(";")[0] || "bin";
  const extensionMatch = name.match(/\.([a-zA-Z0-9]{1,8})$/);
  const extension = (extensionMatch?.[1] || fallbackExtension).toLowerCase();
  const base = name
    .replace(/\.[^.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase()
    .slice(0, 90);

  return `${base || "upload"}.${extension}`;
}

export const useMediaStore = create<MediaState>()(
  (set) => ({
    assets: [],
    loading: false,
    uploading: false,
    loaded: false,

    fetchAll: async () => {
      set({ loading: true });
      const { data, error } = await supabase.from("media_assets").select("*").order("uploaded_at", { ascending: false });
      if (error) console.error("fetch media_assets failed:", error.message);
      set({ assets: (data || []).map(mapAsset), loading: false, loaded: true });
    },

    uploadFile: async (rawFile, folder) => {
      set({ uploading: true });
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) {
          throw new Error("Please sign in to the admin panel again before uploading media.");
        }
        const { data: staff, error: staffError } = await supabase
          .from("staff_members")
          .select("id, active")
          .eq("id", userData.user.id)
          .single();
        if (staffError || !staff?.active) {
          throw new Error("This Supabase account is not an active staff member, so media uploads are blocked by RLS.");
        }

        const file = await compressImage(rawFile);
        const storageFileName = safeStorageFileName(file.name, file.type);
        const path = `${folder}/${Date.now()}-${storageFileName}`;
        const { error: uploadError } = await supabase.storage.from("media").upload(path, file, { cacheControl: "3600", upsert: false });
        if (uploadError) throw uploadError;
        const { data: publicUrlData } = supabase.storage.from("media").getPublicUrl(path);
        const { data, error } = await supabase
          .from("media_assets")
          .insert({
            file_name: file.name,
            folder,
            file_type: file.type.startsWith("video") ? "video" : "image",
            alt_text: file.name,
            storage_path: publicUrlData.publicUrl,
            file_size: file.size,
          })
          .select()
          .single();
        if (error) throw error;
        const asset = mapAsset(data);
        set((s) => ({ assets: [asset, ...s.assets] }));
        return asset;
      } finally {
        set({ uploading: false });
      }
    },

    deleteAsset: async (id) => {
      const { error } = await supabase.from("media_assets").delete().eq("id", id);
      if (error) throw error;
      set((s) => ({ assets: s.assets.filter((a) => a.id !== id) }));
    },
  })
);