import { useEffect, useState } from "react";
import { useCMSStore } from "../../store/cmsStore";
import { useToastStore } from "../../store/toastStore";
import { useIPRuleStore } from "../../store/ipRuleStore";
import Toggle from "../../components/ui/Toggle";
import MediaPickerModal from "../../components/admin/MediaPickerModal";
import ProductImage from "../../components/customer/ProductImage";
import { Trash2 } from "lucide-react";

export default function SettingsAdmin() {
  const { settings, updateSettings, persistSettings } = useCMSStore();
  const { rules, fetchAll: fetchIPRules, addRule, deleteRule } = useIPRuleStore();
  const showToast = useToastStore((s) => s.show);
  const [pickerField, setPickerField] = useState<"logoUrl" | "logoDarkUrl" | "faviconUrl" | "ogDefaultImage" | null>(null);
  const [newRule, setNewRule] = useState({ ipAddress: "", type: "block" as "allow" | "block", reason: "" });

  useEffect(() => { fetchIPRules(); }, [fetchIPRules]);

  async function handleAddRule() {
    if (!newRule.ipAddress.trim()) return;
    try {
      await addRule({ ipAddress: newRule.ipAddress.trim(), type: newRule.type, reason: newRule.reason, scope: "all", active: true });
      setNewRule({ ipAddress: "", type: "block", reason: "" });
      showToast("IP rule added", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to add rule", "error");
    }
  }

  async function handleDeleteRule(id: string) {
    try {
      await deleteRule(id);
      showToast("IP rule removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove rule", "error");
    }
  }

  async function saved() {
    try {
      await persistSettings();
      showToast("Settings saved", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to save settings", "error");
    }
  }

  async function selectAsset(field: typeof pickerField, url: string) {
    if (!field) return;
    updateSettings({ [field]: url });
    await saved();
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Brand Assets</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {([
            { key: "logoUrl" as const, label: "Logo" },
            { key: "logoDarkUrl" as const, label: "Logo (Dark Backgrounds)" },
            { key: "faviconUrl" as const, label: "Favicon" },
          ]).map(({ key, label }) => (
            <div key={key}>
              <label className="field-label">{label}</label>
              <button
                type="button"
                onClick={() => setPickerField(key)}
                className="w-full aspect-square max-w-[120px] rounded-lg border border-neutral-200 hover:border-[var(--color-primary)] overflow-hidden bg-neutral-50 flex items-center justify-center"
              >
                {settings[key] ? <ProductImage src={settings[key]} alt={label} /> : <span className="text-xs text-neutral-400">Click to set</span>}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Business Information</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="field-label">Store Name</label><input value={settings.brandName} onChange={(e) => updateSettings({ brandName: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Support Email</label><input value={settings.supportEmail} onChange={(e) => updateSettings({ supportEmail: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Support Phone</label><input value={settings.supportPhone} onChange={(e) => updateSettings({ supportPhone: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">WhatsApp Number</label><input value={settings.whatsappNumber} onChange={(e) => updateSettings({ whatsappNumber: e.target.value })} onBlur={saved} className="input" /></div>
          <div className="sm:col-span-2"><label className="field-label">Business Address</label><input value={settings.businessAddress} onChange={(e) => updateSettings({ businessAddress: e.target.value })} onBlur={saved} className="input" /></div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Theme</h3>
        <div className="grid sm:grid-cols-4 gap-4">
          <div><label className="field-label">Primary / Accent</label><input type="color" value={settings.primaryColor} onChange={(e) => updateSettings({ primaryColor: e.target.value, accentColor: e.target.value, buttonColor: e.target.value })} onBlur={saved} className="w-full h-10 rounded border border-neutral-200" /></div>
          <div><label className="field-label">Secondary</label><input type="color" value={settings.secondaryColor} onChange={(e) => updateSettings({ secondaryColor: e.target.value })} onBlur={saved} className="w-full h-10 rounded border border-neutral-200" /></div>
          <div><label className="field-label">Background</label><input type="color" value={settings.backgroundColor} onChange={(e) => updateSettings({ backgroundColor: e.target.value })} onBlur={saved} className="w-full h-10 rounded border border-neutral-200" /></div>
          <div><label className="field-label">Body Text</label><input type="color" value={settings.textColor} onChange={(e) => updateSettings({ textColor: e.target.value })} onBlur={saved} className="w-full h-10 rounded border border-neutral-200" /></div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">Heading Font</label>
            <select value={settings.fontHeading} onChange={(e) => { updateSettings({ fontHeading: e.target.value }); saved(); }} className="select">
              <option>Inter</option><option>Anton</option><option>Bebas Neue</option><option>Playfair Display</option>
            </select>
          </div>
          <div>
            <label className="field-label">Body Font</label>
            <select value={settings.fontBody} onChange={(e) => { updateSettings({ fontBody: e.target.value }); saved(); }} className="select">
              <option>Inter</option><option>Roboto</option><option>Open Sans</option>
            </select>
          </div>
        </div>
        <p className="text-xs text-neutral-400">Colors apply instantly across the storefront via CSS variables — no redeploy needed. Font changes need the fonts linked in index.html to take visual effect.</p>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Social Links</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="field-label">Instagram</label><input value={settings.instagramUrl} onChange={(e) => updateSettings({ instagramUrl: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Facebook</label><input value={settings.facebookUrl} onChange={(e) => updateSettings({ facebookUrl: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">YouTube</label><input value={settings.youtubeUrl} onChange={(e) => updateSettings({ youtubeUrl: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Twitter / X</label><input value={settings.twitterUrl} onChange={(e) => updateSettings({ twitterUrl: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">TikTok</label><input value={settings.tiktokUrl} onChange={(e) => updateSettings({ tiktokUrl: e.target.value })} onBlur={saved} className="input" /></div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Shipping & Payments</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="field-label">Free Shipping Above (₹)</label><input type="number" value={settings.freeShippingThreshold} onChange={(e) => updateSettings({ freeShippingThreshold: +e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Standard Shipping Charge (₹)</label><input type="number" value={settings.standardShippingCharge} onChange={(e) => updateSettings({ standardShippingCharge: +e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Express Shipping Charge (₹)</label><input type="number" value={settings.expressShippingCharge} onChange={(e) => updateSettings({ expressShippingCharge: +e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">COD Charge (₹)</label><input type="number" value={settings.codCharge} onChange={(e) => updateSettings({ codCharge: +e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">UPI ID (for manual/QR payments)</label><input value={settings.upiId} onChange={(e) => updateSettings({ upiId: e.target.value })} onBlur={saved} className="input" placeholder="yourstore@upi" /></div>
        </div>
        <div className="flex items-center justify-between"><label className="field-label mb-0">Cash on Delivery Available</label><Toggle on={settings.codAvailable} onChange={(v) => { updateSettings({ codAvailable: v }); saved(); }} /></div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Feature Toggles</h3>
        <div className="flex items-center justify-between text-sm"><span>Product Reviews</span><Toggle on={settings.reviewsEnabled} onChange={(v) => { updateSettings({ reviewsEnabled: v }); saved(); }} /></div>
        <div className="flex items-center justify-between text-sm"><span>Wishlist</span><Toggle on={settings.wishlistEnabled} onChange={(v) => { updateSettings({ wishlistEnabled: v }); saved(); }} /></div>
        <div className="flex items-center justify-between text-sm"><span>Guest Checkout</span><Toggle on={settings.guestCheckoutEnabled} onChange={(v) => { updateSettings({ guestCheckoutEnabled: v }); saved(); }} /></div>
        <div className="flex items-center justify-between text-sm"><span>Coupons</span><Toggle on={settings.couponsEnabled} onChange={(v) => { updateSettings({ couponsEnabled: v }); saved(); }} /></div>
        <div className="flex items-center justify-between text-sm"><span>Newsletter Signup</span><Toggle on={settings.newsletterEnabled} onChange={(v) => { updateSettings({ newsletterEnabled: v }); saved(); }} /></div>
      </div>

      <div className="card p-5 space-y-3">
        <h3 className="font-semibold text-sm">Security</h3>
        <div className="flex items-center justify-between text-sm">
          <div>
            <span>Require 2FA for all admin accounts</span>
            <p className="text-xs text-neutral-400">Staff without two-factor set up will be asked to enroll on next login.</p>
          </div>
          <Toggle on={settings.require2faForAdmin} onChange={(v) => { updateSettings({ require2faForAdmin: v }); saved(); }} />
        </div>
        <div><label className="field-label">Uptime Monitor URL (optional)</label><input value={settings.uptimeMonitorUrl} onChange={(e) => updateSettings({ uptimeMonitorUrl: e.target.value })} onBlur={saved} className="input" placeholder="https://status.yoursite.com" /></div>

        <div className="pt-3 border-t border-neutral-100">
          <h4 className="text-sm font-medium mb-1">IP Allow / Block List</h4>
          <p className="text-xs text-neutral-400 mb-3">Enforced in the payment Edge Functions.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                <input
                  value={newRule.ipAddress}
                  onChange={(e) => setNewRule({ ...newRule, ipAddress: e.target.value })}
                  placeholder="e.g. 203.0.113.42"
                  className="input !w-40 !py-1.5 text-sm"
                />
                <select value={newRule.type} onChange={(e) => setNewRule({ ...newRule, type: e.target.value as "allow" | "block" })} className="select !w-auto !py-1.5 text-sm">
                  <option value="block">Block</option>
                  <option value="allow">Allow-list</option>
                </select>
                <input
                  value={newRule.reason}
                  onChange={(e) => setNewRule({ ...newRule, reason: e.target.value })}
                  placeholder="Reason (optional)"
                  className="input flex-1 !py-1.5 text-sm"
                />
                <button onClick={handleAddRule} className="btn btn-outline btn-sm">Add Rule</button>
              </div>
              <div className="space-y-1.5">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-neutral-50">
                    <span>
                      <span className={`badge mr-2 ${r.type === "block" ? "bg-rose-100 text-rose-600" : "bg-green-100 text-green-700"}`}>{r.type}</span>
                      <span className="font-mono">{r.ipAddress}</span>
                      {r.reason && <span className="text-neutral-400 ml-2">— {r.reason}</span>}
                    </span>
                    <button onClick={() => handleDeleteRule(r.id)} className="text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
                  </div>
                ))}
                {rules.length === 0 && <p className="text-xs text-neutral-400">No IP rules — everyone can reach the store.</p>}
              </div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Analytics & Tracking</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div><label className="field-label">Google Analytics ID</label><input value={settings.googleAnalyticsId} onChange={(e) => updateSettings({ googleAnalyticsId: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Meta Pixel ID</label><input value={settings.metaPixelId} onChange={(e) => updateSettings({ metaPixelId: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Microsoft Clarity ID</label><input value={settings.microsoftClarityId} onChange={(e) => updateSettings({ microsoftClarityId: e.target.value })} onBlur={saved} className="input" /></div>
          <div><label className="field-label">Google Tag Manager ID</label><input value={settings.googleTagManagerId} onChange={(e) => updateSettings({ googleTagManagerId: e.target.value })} onBlur={saved} className="input" placeholder="GTM-XXXXXXX" /></div>
          <div className="sm:col-span-2"><label className="field-label">Google Search Console Verification Code</label><input value={settings.googleSearchConsoleCode} onChange={(e) => updateSettings({ googleSearchConsoleCode: e.target.value })} onBlur={saved} className="input" /></div>
        </div>
      </div>

      <div className="card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Default SEO</h3>
        <div><label className="field-label">Title Template (%s becomes the page title)</label><input value={settings.seoTitleTemplate} onChange={(e) => updateSettings({ seoTitleTemplate: e.target.value })} onBlur={saved} className="input" /></div>
        <div><label className="field-label">Default Meta Title</label><input value={settings.seoDefaultTitle} onChange={(e) => updateSettings({ seoDefaultTitle: e.target.value })} onBlur={saved} className="input" /></div>
        <div><label className="field-label">Default Meta Description</label><textarea value={settings.seoDefaultDescription} onChange={(e) => updateSettings({ seoDefaultDescription: e.target.value })} onBlur={saved} className="textarea" rows={2} /></div>
        <div><label className="field-label">Default Keywords (comma-separated)</label><input value={settings.seoDefaultKeywords} onChange={(e) => updateSettings({ seoDefaultKeywords: e.target.value })} onBlur={saved} className="input" /></div>
        <div>
          <label className="field-label">Default Social Share Image</label>
          <button
            type="button"
            onClick={() => setPickerField("ogDefaultImage")}
            className="w-full max-w-xs aspect-video rounded-lg border border-neutral-200 hover:border-[var(--color-primary)] overflow-hidden bg-neutral-50 flex items-center justify-center"
          >
            {settings.ogDefaultImage ? <ProductImage src={settings.ogDefaultImage} alt="Default share image" /> : <span className="text-xs text-neutral-400">Click to set</span>}
          </button>
        </div>
      </div>


      <MediaPickerModal
        open={pickerField !== null}
        onClose={() => setPickerField(null)}
        folder="brand"
        onSelect={(url) => selectAsset(pickerField, url)}
      />
    </div>
  );
}
