import { KEYRA_SOVEREIGN_REGISTRY } from "@/services/keyra/constants";

export function KeyraObjectBanner() {
  return (
    <div className="mb-6 rounded-xl border border-[rgba(12,45,74,0.1)] bg-[rgba(255,255,255,0.7)] px-4 py-3 backdrop-blur-sm">
      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[rgba(12,45,74,0.45)]">
        KEYRA Trust Object
      </p>
      <p className="mt-1 text-sm font-medium text-[var(--sn-blue)]">
        {KEYRA_SOVEREIGN_REGISTRY.object_name}
      </p>
      <p className="mt-0.5 font-mono text-xs text-[rgba(12,45,74,0.5)]">
        {KEYRA_SOVEREIGN_REGISTRY.canonical_path}
      </p>
    </div>
  );
}
