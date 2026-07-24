import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuthStore } from "../../store/authStore";

export default function AdminGuard() {
  const isAdmin = useAdminAuthStore((s) => s.isAdmin);
  const loading = useAdminAuthStore((s) => s.loading);
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-sm">
        Checking admin access...
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  return <Outlet />;
}
