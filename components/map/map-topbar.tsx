"use client";

import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, getLangFromParam, t, type LanguageId } from "@/lib/i18n";

type Props = {
  defaultLang?: LanguageId;
  onChange: (opts: { lang: LanguageId; lowBandwidth: boolean; highContrast: boolean }) => void;
};

export function MapTopbar({ defaultLang = "en", onChange }: Props) {
  const [lang, setLang] = useState<LanguageId>(defaultLang);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const initialLang = getLangFromParam(sp.get("lang"));
    const low = sp.get("low") === "1";
    const hc = sp.get("hc") === "1";
    setLang(initialLang);
    setLowBandwidth(low);
    setHighContrast(hc);
  }, []);

  useEffect(() => {
    onChange({ lang, lowBandwidth, highContrast });
  }, [lang, lowBandwidth, highContrast, onChange]);

  const title = useMemo(() => t(lang, "platformTitle"), [lang]);

  return (
    <div className="sticky top-0 z-20 border-b border-[rgba(12,45,74,0.12)] bg-[rgba(248,246,242,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="sn-eyebrow">Sovereign Namibia</p>
          <h1 className="text-sm font-semibold text-[var(--sn-blue)]">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-[rgba(12,45,74,0.12)] bg-white px-3 py-2 text-xs text-[rgba(12,45,74,0.72)]">
            <span className="whitespace-nowrap">{t(lang, "language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as LanguageId)} className="bg-transparent text-xs">
              {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[rgba(12,45,74,0.12)] bg-white px-3 py-2 text-xs text-[rgba(12,45,74,0.72)]">
            <input type="checkbox" checked={lowBandwidth} onChange={(e) => setLowBandwidth(e.target.checked)} />
            <span>{t(lang, "lowBandwidth")}</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-[rgba(12,45,74,0.12)] bg-white px-3 py-2 text-xs text-[rgba(12,45,74,0.72)]">
            <input type="checkbox" checked={highContrast} onChange={(e) => setHighContrast(e.target.checked)} />
            <span>{t(lang, "highContrast")}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

