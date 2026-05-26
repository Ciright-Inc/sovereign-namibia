import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/admin-rbac";

export async function requireAdmin(permission?: Permission) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }
  if (permission && !hasPermission(session.role, permission)) {
    redirect("/admin/dashboard?error=access_denied");
  }
  return session;
}
