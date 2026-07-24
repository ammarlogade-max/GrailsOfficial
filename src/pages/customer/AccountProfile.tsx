import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { useToastStore } from "../../store/toastStore";

export default function AccountProfile() {
  const user = useAuthStore((s) => s.user);
  const showToast = useToastStore((s) => s.show);
  const [form, setForm] = useState({ fullName: user?.fullName || "", email: user?.email || "", phone: user?.phone || "" });

  function save(e: React.FormEvent) {
    e.preventDefault();
    showToast("Profile updated successfully!", "success");
  }

  return (
    <form onSubmit={save} className="card p-5 max-w-lg space-y-4">
      <h3 className="font-semibold">Personal Information</h3>
      <div>
        <label className="field-label">Full Name</label>
        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="input" />
      </div>
      <div>
        <label className="field-label">Email</label>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
      </div>
      <div>
        <label className="field-label">Phone</label>
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
      </div>
      <button className="btn btn-primary">Save Changes</button>
    </form>
  );
}
