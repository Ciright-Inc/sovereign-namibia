import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

async function getAdminProfile(userId: string) {
  try {
    const result = await query<{ full_name: string; role_name: string }>(
      `SELECT a.full_name, r.name AS role_name
       FROM sn_admin_users a
       LEFT JOIN sn_roles r ON r.id = a.role_id
       WHERE a.id = $1`,
      [userId]
    );
    return result.rows[0];
  } catch {
    return { full_name: "Demo Administrator", role_name: "Super Admin" };
  }
}

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }

  const profile = await getAdminProfile(session.userId);

  return (
    <AdminShell adminName={profile?.full_name} adminRole={profile?.role_name ?? session.role}>
      {children}
    </AdminShell>
  );
}
