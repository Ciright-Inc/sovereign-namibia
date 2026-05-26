import { requireAdmin } from "@/lib/require-admin";
import { GlobalSearchPanel } from "@/components/admin/global-search-panel";

export default async function AdminSearchPage() {
  await requireAdmin("search.global");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#6b7280]">Sovereign Search</p>
        <h1 className="mt-2 text-2xl font-semibold text-white">Global Registry Search</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#9ca3af]">
          Fuzzy and full-text search across citizens, businesses, ministries, hospitals, banks,
          infrastructure, identifiers, and addresses. All searches are audit-logged.
        </p>
      </div>
      <GlobalSearchPanel />
    </div>
  );
}
