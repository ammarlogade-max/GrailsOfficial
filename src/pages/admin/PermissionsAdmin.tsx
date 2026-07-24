import { useEffect, useState } from "react";
import { Plus, Shield, Loader2, ShieldCheck, Trash2, QrCode } from "lucide-react";
import { useStaffStore } from "../../store/staffStore";
import { useToastStore } from "../../store/toastStore";
import Modal from "../../components/ui/Modal";
import Toggle from "../../components/ui/Toggle";
import { timeAgo } from "../../lib/format";
import { isSupabaseConfigured } from "../../lib/supabase";
import { listFactors, startEnrollment, confirmEnrollment, unenroll, type MFAFactor } from "../../lib/mfa";

export default function PermissionsAdmin() {
  const { staff, roles, loading, fetchAll, toggleStaffActive } = useStaffStore();
  const showToast = useToastStore((s) => s.show);
  const [tab, setTab] = useState<"staff" | "roles" | "security">("staff");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [factors, setFactors] = useState<MFAFactor[]>([]);
  const [enrolling, setEnrolling] = useState<{ factorId: string; qrCodeSvg: string; secret: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => {
    if (tab === "security" && isSupabaseConfigured) {
      listFactors().then(setFactors).catch((err) => showToast(err instanceof Error ? err.message : "Failed to load 2FA status", "error"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function handleStartEnroll() {
    setMfaBusy(true);
    try {
      const result = await startEnrollment();
      setEnrolling(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to start 2FA enrollment", "error");
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleConfirmEnroll() {
    if (!enrolling || verifyCode.length !== 6) return;
    setMfaBusy(true);
    try {
      await confirmEnrollment(enrolling.factorId, verifyCode);
      showToast("Two-factor authentication enabled", "success");
      setEnrolling(null);
      setVerifyCode("");
      setFactors(await listFactors());
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Invalid code — try again", "error");
    } finally {
      setMfaBusy(false);
    }
  }

  async function handleUnenroll(factorId: string) {
    if (!confirm("Remove this authenticator? You'll be able to log in with just your password again.")) return;
    try {
      await unenroll(factorId);
      setFactors(await listFactors());
      showToast("Two-factor authentication removed", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to remove", "error");
    }
  }

  async function handleToggle(id: string) {
    try {
      await toggleStaffActive(id);
      showToast("Staff status updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update staff member", "error");
    }
  }

  return (
    <div>
      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("staff")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "staff" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>Staff Members</button>
        <button onClick={() => setTab("roles")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "roles" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>Roles & Permissions</button>
        <button onClick={() => setTab("security")} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === "security" ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"}`}>My Security</button>
      </div>

      {loading && <div className="flex items-center gap-2 text-sm text-neutral-400 mb-4"><Loader2 size={14} className="animate-spin" /> Loading...</div>}

      {tab === "staff" && (
        <div>
          <div className="flex justify-end mb-3"><button onClick={() => setInviteOpen(true)} className="btn btn-primary btn-sm"><Plus size={14} /> Invite Staff</button></div>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-neutral-50 text-neutral-500 text-xs">
                <tr><th className="text-left px-4 py-3 font-medium">Name</th><th className="text-left px-4 py-3 font-medium">Email</th><th className="text-left px-4 py-3 font-medium">Role</th><th className="text-left px-4 py-3 font-medium">Last Active</th><th className="text-left px-4 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-medium">{s.name}</td>
                    <td className="px-4 py-3 text-neutral-500">{s.email}</td>
                    <td className="px-4 py-3">{roles.find((r) => r.id === s.roleId)?.displayName}</td>
                    <td className="px-4 py-3 text-neutral-400 text-xs">{timeAgo(s.lastActive)}</td>
                    <td className="px-4 py-3"><Toggle on={s.active} onChange={() => handleToggle(s.id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "roles" && (
        <div className="grid sm:grid-cols-2 gap-4">
          {roles.map((r) => (
            <div key={r.id} className="card p-4">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-[var(--color-primary)]" />
                <p className="font-medium text-sm">{r.displayName}</p>
                {r.isSystemRole && <span className="badge bg-neutral-100 text-neutral-500">System</span>}
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">{r.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {r.permissions.slice(0, 6).map((p) => <span key={p} className="badge bg-neutral-50 border border-neutral-200 text-neutral-600">{p}</span>)}
                {r.permissions.length > 6 && <span className="badge bg-neutral-50 border border-neutral-200 text-neutral-600">+{r.permissions.length - 6} more</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "security" && (
        <div className="max-w-lg">
          {!isSupabaseConfigured ? (
            <div className="card p-8 text-center">
              <ShieldCheck size={32} className="mx-auto text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-500">Two-factor authentication needs a real Supabase connection — there's nothing to enroll in this offline demo.</p>
            </div>
          ) : (
            <div className="card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Two-Factor Authentication</h3>
                <p className="text-xs text-neutral-500 mt-1">Adds a second step to your login using an authenticator app like Google Authenticator or Authy.</p>
              </div>

              {factors.length > 0 && (
                <div className="space-y-2">
                  {factors.map((f) => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="text-green-600" />
                        <span className="text-sm">{f.friendlyName || "Authenticator App"}</span>
                        <span className="badge bg-green-100 text-green-700">{f.status}</span>
                      </div>
                      <button onClick={() => handleUnenroll(f.id)} className="p-1.5 text-neutral-400 hover:text-rose-500"><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
              )}

              {factors.length === 0 && !enrolling && (
                <button onClick={handleStartEnroll} disabled={mfaBusy} className="btn btn-primary btn-sm">
                  <QrCode size={14} /> {mfaBusy ? "Starting..." : "Set Up Two-Factor Authentication"}
                </button>
              )}

              {enrolling && (
                <div className="space-y-3 pt-2 border-t border-neutral-100">
                  <p className="text-sm">Scan this QR code with your authenticator app:</p>
                  <div className="w-48 h-48 mx-auto" dangerouslySetInnerHTML={{ __html: enrolling.qrCodeSvg }} />
                  <p className="text-xs text-neutral-500 text-center">Or enter this code manually: <code className="font-mono bg-neutral-100 px-1.5 py-0.5 rounded">{enrolling.secret}</code></p>
                  <input
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    className="input text-center tracking-[0.3em]"
                    inputMode="numeric"
                  />
                  <button onClick={handleConfirmEnroll} disabled={mfaBusy || verifyCode.length !== 6} className="btn btn-primary w-full">
                    {mfaBusy ? "Verifying..." : "Verify & Enable"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a Staff Member">
        <div className="space-y-3 text-sm text-neutral-600">
          {isSupabaseConfigured ? (
            <>
              <p>Adding staff needs a one-time step outside this panel, since it involves creating a real login — this app doesn't hold the permissions to do that safely from the browser.</p>
              <ol className="list-decimal pl-5 space-y-1.5">
                <li>Ask the person to register a normal account at <code className="font-mono text-xs bg-neutral-100 px-1 rounded">/register</code>.</li>
                <li>Find their user ID in your Supabase dashboard (Authentication → Users).</li>
                <li>Run this in the SQL Editor, swapping in their details:</li>
              </ol>
              <pre className="bg-neutral-900 text-neutral-100 text-xs rounded-lg p-3 overflow-x-auto">{`insert into staff_members (id, name, email, role_id)
values ('<user-id>', 'Their Name', 'their@email.com', 'store_manager');`}</pre>
              <p className="text-xs text-neutral-400">Full details are in SETUP.md under "Creating your first admin user".</p>
            </>
          ) : (
            <p>In this demo, staff invitations are simulated. In production, this walks you through a one-time SQL step — see SETUP.md.</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
