"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MapTopbar } from "@/components/map/map-topbar";
import { NamibiaMap } from "@/components/map/namibia-map";
import { PinInfoCard } from "@/components/map/pin-info-card";
import { getLangFromParam, t, type LanguageId } from "@/lib/i18n";
import type { MapPinRecord } from "@/lib/map/map-pins-service";
import type { GeoJSONFeatureCollection } from "@/lib/map/geojson-to-svg";
import { MAP_PIN_TYPES } from "@/lib/map/map-pins-constants";
import { NAMIBIA_REGIONS } from "@/lib/constants";

export function MapExperience() {
  const [lang, setLang] = useState<LanguageId>("en");
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const [adm1, setAdm1] = useState<GeoJSONFeatureCollection | null>(null);
  const [pins, setPins] = useState<MapPinRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<MapPinRecord | null>(null);

  const [q, setQ] = useState("");
  const [region, setRegion] = useState("");
  const [pinType, setPinType] = useState("");
  const [publicOnly, setPublicOnly] = useState(true);

  const applyPreferences = useCallback((opts: { lang: LanguageId; lowBandwidth: boolean; highContrast: boolean }) => {
    setLang(opts.lang);
    setLowBandwidth(opts.lowBandwidth);
    setHighContrast(opts.highContrast);
  }, []);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setLang(getLangFromParam(sp.get("lang")));
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [adm1Res, pinsRes] = await Promise.all([
          fetch("/geo/namibia-adm1.geojson", { cache: "force-cache" }),
          fetch("/api/map/pins"),
        ]);
        const adm1Json = await adm1Res.json();
        const pinsJson = await pinsRes.json();
        if (!adm1Res.ok) throw new Error("Failed to load map boundaries");
        if (!pinsRes.ok) throw new Error(pinsJson.error ?? "Failed to load pins");
        setAdm1(adm1Json as GeoJSONFeatureCollection);
        setPins(pinsJson.pins ?? []);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load map");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredPins = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return pins.filter((p) => {
      if (publicOnly && (p.public_visibility_rules?.public === false)) return false;
      if (region && (p.region ?? "") !== region) return false;
      if (pinType && p.pin_type !== pinType) return false;
      if (qq) {
        const hay = `${p.pin_name} ${p.description ?? ""} ${p.pin_type} ${p.region ?? ""}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [pins, q, region, pinType, publicOnly]);

  return (
    <div className={highContrast ? "contrast-125" : undefined}>
      <MapTopbar onChange={applyPreferences} />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <section className="sn-card p-8">
          <p className="sn-eyebrow">National Infrastructure + Opportunity Map</p>
          <h2 className="mt-3 text-3xl font-semibold text-[var(--sn-blue)]">
            {t(lang, "platformTitle")}
          </h2>
          <p className="mt-4 sn-prose text-sm">
            {t(lang, "platformSubtitle")}
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/trust" className="sn-btn sn-btn-primary">{t(lang, "trustDashboard")}</Link>
            <a href="#rights" className="sn-btn sn-btn-outline">{t(lang, "yourRights")}</a>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-4">
            <div className="sn-card p-6">
              <h3 className="font-semibold text-[var(--sn-blue)]">Explore pins</h3>
              <p className="mt-2 text-sm text-[rgba(12,45,74,0.65)]">
                Region-balanced visibility. No personal identity numbers, no home addresses, no surveillance.
              </p>

              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t(lang, "searchPins")}
                className="mt-4 w-full rounded-lg border border-[rgba(12,45,74,0.18)] bg-[rgba(248,246,242,0.75)] px-3 py-2 text-sm text-[var(--sn-blue)]"
              />

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <label className="text-xs text-[rgba(12,45,74,0.6)]">
                  {t(lang, "filterRegion")}
                  <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-2 w-full rounded-lg border border-[rgba(12,45,74,0.18)] bg-white px-3 py-2 text-sm text-[var(--sn-blue)]">
                    <option value="">All regions</option>
                    {NAMIBIA_REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </label>
                <label className="text-xs text-[rgba(12,45,74,0.6)]">
                  {t(lang, "filterType")}
                  <select value={pinType} onChange={(e) => setPinType(e.target.value)} className="mt-2 w-full rounded-lg border border-[rgba(12,45,74,0.18)] bg-white px-3 py-2 text-sm text-[var(--sn-blue)]">
                    <option value="">All types</option>
                    {MAP_PIN_TYPES.map((tpe) => <option key={tpe} value={tpe}>{tpe}</option>)}
                  </select>
                </label>
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-[rgba(12,45,74,0.7)]">
                <input type="checkbox" checked={publicOnly} onChange={(e) => setPublicOnly(e.target.checked)} />
                {t(lang, "publicOnly")}
              </label>

              <p className="mt-4 text-xs text-[rgba(12,45,74,0.6)]">
                Showing <span className="font-mono">{filteredPins.length}</span> pin(s).
              </p>
            </div>

            <div id="rights" className="sn-card p-6">
              <p className="sn-eyebrow">{t(lang, "yourRights")}</p>
              <h3 className="mt-2 text-xl font-semibold text-[var(--sn-blue)]">Citizen-owned data. Consent-based participation.</h3>
              <ul className="mt-4 space-y-2 text-sm text-[rgba(12,45,74,0.7)]">
                <li><strong>What’s public:</strong> Verified public infrastructure and institutional locations, with source attribution.</li>
                <li><strong>What stays private:</strong> personal identity numbers, home addresses, health records, financial records, children’s data.</li>
                <li><strong>Consent:</strong> community participation is optional. You choose what you share.</li>
                <li><strong>Appeals & corrections:</strong> request updates with evidence and track outcomes.</li>
                <li><strong>Protection:</strong> visibility rules restrict sensitive infrastructure and avoid harm.</li>
              </ul>
              <p className="mt-4 text-xs text-[rgba(12,45,74,0.6)]">
                This platform is designed to be neutral, transparent, and auditable — serving all regions equally.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="sn-card p-6">
              <h3 className="font-semibold text-[var(--sn-blue)]">Interactive map</h3>
              <p className="mt-2 text-sm text-[rgba(12,45,74,0.65)]">
                Accurate regional boundaries (ADM1) + precise WGS84 pin placement. Zoom, pan, clustering, and a low-bandwidth fallback.
              </p>
              <div className="mt-5">
                {loading || !adm1 ? (
                  <div className="rounded-xl border border-[rgba(12,45,74,0.12)] bg-white p-6 text-sm text-[rgba(12,45,74,0.65)]">
                    {t(lang, "loading")}
                  </div>
                ) : (
                  <NamibiaMap
                    adm1={adm1}
                    pins={filteredPins}
                    lowBandwidth={lowBandwidth}
                    highContrast={highContrast}
                    onPinClick={(p) => setSelected(p)}
                  />
                )}
              </div>
            </div>

            {selected && (
              <PinInfoCard pin={selected} lang={lang} onClose={() => setSelected(null)} />
            )}

            <div className="sn-card p-6">
              <h3 className="font-semibold text-[var(--sn-blue)]">Citizen storytelling</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {[
                  { title: "A student in Oshikoto", body: "Discovers nearby schools, scholarship hubs, and verified community projects — without exposing private data." },
                  { title: "A nurse in Kavango East", body: "Sees service points and hospitals clearly on the map, helping communities navigate access to care." },
                  { title: "An entrepreneur in Hardap", body: "Finds opportunity corridors, banks, and business support locations — with transparent source attribution." },
                  { title: "A farmer in Omusati", body: "Reports missing water points safely through the correction workflow, with review and accountability." },
                ].map((s) => (
                  <div key={s.title} className="rounded-xl border border-[rgba(12,45,74,0.12)] bg-white p-5">
                    <p className="text-sm font-semibold text-[var(--sn-blue)]">{s.title}</p>
                    <p className="mt-2 text-sm text-[rgba(12,45,74,0.65)]">{s.body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-[rgba(12,45,74,0.72)]">
                “This platform protects us, includes us, represents us, and helps build Namibia’s future together.”
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-2xl border border-[rgba(12,45,74,0.12)] bg-white p-8">
          <p className="sn-eyebrow">Data sources</p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--sn-blue)]">Regional boundaries and attribution</h3>
          <p className="mt-3 text-sm text-[rgba(12,45,74,0.65)]">
            Boundaries: geoBoundaries (Humanitarian release) — Namibia Statistics Agency (NSA), via HDX (see <code>public/geo/namibia-adm1.source.txt</code>).
          </p>
        </section>
      </div>
    </div>
  );
}

