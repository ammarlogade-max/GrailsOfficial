import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, GripVertical, Plus, Trash2 } from "lucide-react";
import { useCMSStore } from "../../store/cmsStore";
import ProductImage from "../../components/customer/ProductImage";
import MediaPickerModal from "../../components/admin/MediaPickerModal";
import { useMediaStore } from "../../store/mediaStore";
import Toggle from "../../components/ui/Toggle";
import { useToastStore } from "../../store/toastStore";

const tabs = ["Branding", "Hero Section", "Announcement Bar", "Offer Banners", "Homepage Sections"] as const;

export default function HomepageCMS() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Branding");
  const {
    settings, hero, announcement, banners, sections,
    fetchAll, updateSettings, persistSettings, updateHero, persistHero,
    updateAnnouncement, persistAnnouncement, updateBanner, persistBanner, addBanner, removeBanner,
    updateSection, persistSection,
  } = useCMSStore();
  const showToast = useToastStore((s) => s.show);
  const uploadMediaFile = useMediaStore((s) => s.uploadFile);
  const [heroPickerField, setHeroPickerField] = useState<"photo" | "posterImage" | null>(null);
  const [heroVideoUploading, setHeroVideoUploading] = useState(false);
  const heroVideoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleHeroVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setHeroVideoUploading(true);
    try {
      const uploaded = await uploadMediaFile(file, "hero");
      updateHero({ videoUrl: uploaded.photo });
      await persistHero();
      showToast("Hero video uploaded", "success");
    } catch (err) {
      console.error("Hero video upload failed:", err);
      showToast(err instanceof Error ? err.message : "Video upload failed", "error");
    } finally {
      setHeroVideoUploading(false);
      e.target.value = "";
    }
  }

  async function notifySaved(persist?: () => Promise<void>) {
    try {
      if (persist) await persist();
      showToast("Changes saved — live on storefront instantly!", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save changes", "error");
    }
  }

  async function handleAddBanner() {
    const banner = {
      id: `ban-${Date.now()}`, title: "New Banner", subtitle: "", buttonText: "Shop Now", buttonLink: "/products",
      badgeText: "NEW", badgeColor: "#f97316", photo: "", active: true, sortOrder: banners.length + 1,
    };
    try {
      await addBanner(banner);
      showToast("Banner added", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add banner", "error");
    }
  }

  async function handleRemoveBanner(id: string) {
    try {
      await removeBanner(id);
      showToast("Banner removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove banner", "error");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-neutral-500 max-w-lg">
          Changes here update the live storefront instantly — no deploy needed. This is exactly how the real CMS will work.
        </p>
        <Link to="/" target="_blank" className="btn btn-dark btn-sm">View Live Homepage <ExternalLink size={13} /></Link>
      </div>

      <div className="flex gap-1 border-b border-neutral-200 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 ${tab === t ? "border-[var(--color-primary)] text-neutral-900" : "border-transparent text-neutral-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Branding" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div>
              <label className="field-label">Brand Name</label>
              <input value={settings.brandName} onChange={(e) => { updateSettings({ brandName: e.target.value }); }} onBlur={() => notifySaved(persistSettings)} className="input" />
            </div>
            <div>
              <label className="field-label">Tagline</label>
              <input value={settings.brandTagline} onChange={(e) => updateSettings({ brandTagline: e.target.value })} onBlur={() => notifySaved(persistSettings)} className="input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="field-label">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.primaryColor} onChange={(e) => updateSettings({ primaryColor: e.target.value, buttonColor: e.target.value })} onBlur={() => notifySaved(persistSettings)} className="w-10 h-10 rounded border border-neutral-200" />
                  <span className="text-xs font-mono">{settings.primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="field-label">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.secondaryColor} onChange={(e) => updateSettings({ secondaryColor: e.target.value })} onBlur={() => notifySaved(persistSettings)} className="w-10 h-10 rounded border border-neutral-200" />
                  <span className="text-xs font-mono">{settings.secondaryColor}</span>
                </div>
              </div>
              <div>
                <label className="field-label">Button Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={settings.buttonColor} onChange={(e) => updateSettings({ buttonColor: e.target.value })} onBlur={() => notifySaved(persistSettings)} className="w-10 h-10 rounded border border-neutral-200" />
                  <span className="text-xs font-mono">{settings.buttonColor}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-neutral-400">Try changing the primary color — every button, badge, and accent on the storefront updates instantly.</p>
          </div>
          <div className="card p-5 bg-neutral-50">
            <p className="eyebrow text-neutral-400 mb-3">Live Preview — Header</p>
            <div className="bg-white rounded-lg border border-neutral-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded flex items-center justify-center text-white font-display" style={{ background: settings.secondaryColor }}>U</span>
                <span className="font-display text-lg" style={{ color: settings.secondaryColor }}>{settings.brandName}</span>
              </div>
              <button className="btn btn-sm" style={{ background: settings.buttonColor, color: "#fff" }}>Shop Now</button>
            </div>
            <p className="eyebrow text-neutral-400 mb-3 mt-6">Live Preview — Product Badge</p>
            <div className="bg-white rounded-lg border border-neutral-200 p-4 flex gap-3">
              <span className="badge text-white" style={{ background: settings.primaryColor }}>40% OFF</span>
              <span className="badge text-white" style={{ background: settings.secondaryColor }}>New</span>
            </div>
          </div>
        </div>
      )}

      {tab === "Hero Section" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div>
              <label className="field-label">Background Type</label>
              <select
                value={hero.bgType}
                onChange={(e) => { updateHero({ bgType: e.target.value as "image" | "video" | "color" }); notifySaved(persistHero); }}
                className="select"
              >
                <option value="image">Image</option>
                <option value="video">Video (autoplay, muted, loop)</option>
                <option value="color">Solid Color</option>
              </select>
            </div>

            {hero.bgType === "image" && (
              <div>
                <label className="field-label">Background Image</label>
                <button
                  type="button"
                  onClick={() => setHeroPickerField("photo")}
                  className="w-full aspect-video rounded-lg border border-neutral-200 hover:border-[var(--color-primary)] overflow-hidden bg-neutral-50"
                >
                  <ProductImage src={hero.photo} alt="Hero background" />
                </button>
              </div>
            )}

            {hero.bgType === "video" && (
              <div className="space-y-3">
                <div>
                  <label className="field-label">Background Video</label>
                  <div className="flex gap-2 items-center">
                    <input
                      ref={heroVideoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleHeroVideoUpload}
                    />
                    <button type="button" onClick={() => heroVideoInputRef.current?.click()} disabled={heroVideoUploading} className="btn btn-outline btn-sm">
                      {heroVideoUploading ? "Uploading..." : "Upload Video"}
                    </button>
                    <input
                      value={hero.videoUrl}
                      onChange={(e) => updateHero({ videoUrl: e.target.value })}
                      onBlur={() => notifySaved(persistHero)}
                      placeholder="Or paste a hosted video URL (.mp4)"
                      className="input flex-1 text-xs"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Keep it short and compressed (under ~10MB) — it autoplays on every visitor's first load.</p>
                </div>
                <div>
                  <label className="field-label">Poster / Fallback Image</label>
                  <p className="text-xs text-neutral-400 mb-1.5">Shown while the video loads, and instead of the video on connections where it fails.</p>
                  <button
                    type="button"
                    onClick={() => setHeroPickerField("posterImage")}
                    className="w-full max-w-[200px] aspect-video rounded-lg border border-neutral-200 hover:border-[var(--color-primary)] overflow-hidden bg-neutral-50"
                  >
                    {hero.posterImage ? <ProductImage src={hero.posterImage} alt="Poster" /> : <span className="text-xs text-neutral-400 flex items-center justify-center h-full">Click to set</span>}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="field-label">Heading</label>
              <input value={hero.heading} onChange={(e) => updateHero({ heading: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
            </div>
            <div>
              <label className="field-label">Subheading</label>
              <textarea value={hero.subheading} onChange={(e) => updateHero({ subheading: e.target.value })} onBlur={() => notifySaved(persistHero)} className="textarea" rows={2} />
            </div>
            <div>
              <label className="field-label">Offer Badge Text</label>
              <input value={hero.offerBadgeText} onChange={(e) => updateHero({ offerBadgeText: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Primary CTA Text</label>
                <input value={hero.ctaPrimaryText} onChange={(e) => updateHero({ ctaPrimaryText: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
              </div>
              <div>
                <label className="field-label">Primary CTA Link</label>
                <input value={hero.ctaPrimaryLink} onChange={(e) => updateHero({ ctaPrimaryLink: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
              </div>
              <div>
                <label className="field-label">Secondary CTA Text</label>
                <input value={hero.ctaSecondaryText} onChange={(e) => updateHero({ ctaSecondaryText: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
              </div>
              <div>
                <label className="field-label">Secondary CTA Link</label>
                <input value={hero.ctaSecondaryLink} onChange={(e) => updateHero({ ctaSecondaryLink: e.target.value })} onBlur={() => notifySaved(persistHero)} className="input" />
              </div>
            </div>
            <div>
              <label className="field-label">Text Alignment</label>
              <select value={hero.textAlignment} onChange={(e) => { updateHero({ textAlignment: e.target.value as "left" | "center" | "right" }); notifySaved(persistHero); }} className="select">
                <option value="left">Left</option><option value="center">Center</option><option value="right">Right</option>
              </select>
            </div>
          </div>
          <div>
            <p className="eyebrow text-neutral-400 mb-3">Live Preview</p>
            <div className="rounded-xl overflow-hidden relative" style={{ background: "var(--color-secondary)" }}>
              {hero.bgType === "video" && hero.videoUrl ? (
                <video src={hero.videoUrl} poster={hero.posterImage || hero.photo} className="h-56 w-full object-cover opacity-90" autoPlay muted loop playsInline />
              ) : (
                <ProductImage src={hero.photo} alt="Hero preview" className="h-56 opacity-90" />
              )}
              <div className="absolute inset-0 bg-black/50 flex flex-col justify-center p-6">
                <span className="hang-tag bg-[var(--color-primary)] text-white w-fit text-[10px]">{hero.offerBadgeText}</span>
                <h3 className="text-display text-white text-2xl mt-2">{hero.heading}</h3>
                <p className="text-neutral-300 text-xs mt-1 max-w-xs">{hero.subheading}</p>
              </div>
            </div>
          </div>
          <MediaPickerModal
            open={heroPickerField !== null}
            onClose={() => setHeroPickerField(null)}
            folder="hero"
            onSelect={(url) => {
              if (heroPickerField === "photo") updateHero({ photo: url });
              if (heroPickerField === "posterImage") updateHero({ posterImage: url });
              notifySaved(persistHero);
            }}
          />
        </div>
      )}

      {tab === "Announcement Bar" && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="field-label mb-0">Enabled</label>
              <Toggle on={announcement.active} onChange={(v) => { updateAnnouncement({ active: v }); notifySaved(persistAnnouncement); }} />
            </div>
            <div>
              <label className="field-label">Announcement Text</label>
              <textarea value={announcement.text} onChange={(e) => updateAnnouncement({ text: e.target.value })} onBlur={() => notifySaved(persistAnnouncement)} className="textarea" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Background Color</label>
                <input type="color" value={announcement.bgColor} onChange={(e) => updateAnnouncement({ bgColor: e.target.value })} onBlur={() => notifySaved(persistAnnouncement)} className="w-full h-10 rounded border border-neutral-200" />
              </div>
              <div>
                <label className="field-label">Text Color</label>
                <input type="color" value={announcement.textColor} onChange={(e) => updateAnnouncement({ textColor: e.target.value })} onBlur={() => notifySaved(persistAnnouncement)} className="w-full h-10 rounded border border-neutral-200" />
              </div>
            </div>
            <div>
              <label className="field-label">Scroll Speed (seconds per loop)</label>
              <input type="range" min={10} max={60} value={announcement.scrollSpeed} onChange={(e) => updateAnnouncement({ scrollSpeed: +e.target.value })} onMouseUp={() => notifySaved(persistAnnouncement)} onBlur={() => notifySaved(persistAnnouncement)} className="w-full accent-[var(--color-primary)]" />
            </div>
          </div>
          <div>
            <p className="eyebrow text-neutral-400 mb-3">Live Preview</p>
            <div className="overflow-hidden py-2 rounded" style={{ background: announcement.bgColor, color: announcement.textColor }}>
              <span className="font-label px-4 text-sm">{announcement.text}</span>
            </div>
          </div>
        </div>
      )}

      {tab === "Offer Banners" && (
        <div className="space-y-4">
          {banners.map((b) => (
            <div key={b.id} className="card p-4 flex flex-col sm:flex-row gap-4">
              <GripVertical size={16} className="text-neutral-300 hidden sm:block mt-2" />
              <div className="w-full sm:w-32 h-24 rounded-lg overflow-hidden bg-neutral-50 shrink-0">
                <ProductImage src={b.photo} alt={b.title} />
              </div>
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Title</label>
                  <input value={b.title} onChange={(e) => updateBanner(b.id, { title: e.target.value })} onBlur={() => notifySaved(() => persistBanner(b.id))} className="input" />
                </div>
                <div>
                  <label className="field-label">Subtitle</label>
                  <input value={b.subtitle} onChange={(e) => updateBanner(b.id, { subtitle: e.target.value })} onBlur={() => notifySaved(() => persistBanner(b.id))} className="input" />
                </div>
                <div>
                  <label className="field-label">Button Text</label>
                  <input value={b.buttonText} onChange={(e) => updateBanner(b.id, { buttonText: e.target.value })} onBlur={() => notifySaved(() => persistBanner(b.id))} className="input" />
                </div>
                <div>
                  <label className="field-label">Badge Text</label>
                  <input value={b.badgeText} onChange={(e) => updateBanner(b.id, { badgeText: e.target.value })} onBlur={() => notifySaved(() => persistBanner(b.id))} className="input" />
                </div>
              </div>
              <div className="flex sm:flex-col items-center gap-3 shrink-0">
                <Toggle on={b.active} onChange={(v) => { updateBanner(b.id, { active: v }); notifySaved(() => persistBanner(b.id)); }} />
                <button onClick={() => handleRemoveBanner(b.id)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
          <button onClick={handleAddBanner} className="btn btn-outline btn-sm"><Plus size={14} /> Add Banner</button>
        </div>
      )}

      {tab === "Homepage Sections" && (
        <div className="space-y-3">
          {[...sections].sort((a, b) => a.sortOrder - b.sortOrder).map((sec) => (
            <div key={sec.id} className="card p-4 flex items-center gap-4">
              <GripVertical size={16} className="text-neutral-300" />
              <div className="flex-1">
                <input value={sec.title} onChange={(e) => updateSection(sec.id, { title: e.target.value })} onBlur={() => notifySaved(() => persistSection(sec.id))} className="input !py-1.5 font-medium" />
                <p className="text-xs text-neutral-400 mt-1 capitalize">{sec.sectionType.replace(/_/g, " ")}</p>
              </div>
              <div className="w-28">
                <label className="field-label">Products</label>
                <input type="number" min={2} max={12} value={sec.productLimit} onChange={(e) => updateSection(sec.id, { productLimit: +e.target.value })} onBlur={() => notifySaved(() => persistSection(sec.id))} className="input !py-1.5" />
              </div>
              <Toggle on={sec.active} onChange={(v) => { updateSection(sec.id, { active: v }); notifySaved(() => persistSection(sec.id)); }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
