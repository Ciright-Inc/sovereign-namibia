"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_PIN_TYPES } from "@/lib/map/map-pins-constants";
import type { MapPinRecord } from "@/lib/map/map-pins-service";
import {
  computeFeatureCollectionBounds,
  createEquirectangularProjector,
  geometryToPath,
  type GeoJSONFeatureCollection,
} from "@/lib/map/geojson-to-svg";

type Props = {
  adm1: GeoJSONFeatureCollection;
  pins: MapPinRecord[];
  lowBandwidth: boolean;
  highContrast: boolean;
  onPinClick: (pin: MapPinRecord) => void;
};

const VIEW_W = 1200;
const VIEW_H = 900;

function pinColor(type: string) {
  const map: Record<string, string> = {
    "Power Plant": "#f59e0b",
    "Port": "#0ea5e9",
    "Airport": "#38bdf8",
    "Bank": "#22c55e",
    "Telecom Site": "#a78bfa",
    "Data Center": "#93c5fd",
    "Government Office": "#fbbf24",
    "Hospital": "#fb7185",
    "School": "#f472b6",
    "Water Infrastructure": "#60a5fa",
    "Agriculture Hub": "#84cc16",
    "Tourism Site": "#f97316",
    "Emergency Service": "#ef4444",
    "Community Center": "#facc15",
    "Business": "#14b8a6",
    "Verified Organization": "#10b981",
    "Verified Community Project": "#a3e635",
    "Regional Development Project": "#eab308",
  };
  return map[type] ?? "#ffffff";
}

export function NamibiaMap({ adm1, pins, lowBandwidth, highContrast, onPinClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoverId, setHoverId] = useState<string | null>(null);

  const bounds = useMemo(() => computeFeatureCollectionBounds(adm1), [adm1]);
  const projector = useMemo(() => createEquirectangularProjector({ ...bounds, width: VIEW_W, height: VIEW_H }), [bounds]);
  const regionPaths = useMemo(() => {
    return adm1.features.map((f, idx) => ({
      key: String(f.properties.shapeName ?? idx),
      name: String(f.properties.shapeName ?? "Region"),
      d: geometryToPath(f.geometry, projector.project),
    }));
  }, [adm1, projector.project]);

  const projectedPins = useMemo(() => {
    return pins.map((p) => {
      const pt = projector.project(p.longitude, p.latitude);
      return { ...p, x: pt.x, y: pt.y };
    });
  }, [pins, projector]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = -e.deltaY;
      setZoom((z) => {
        const next = Math.min(6, Math.max(0.8, z + (delta > 0 ? 0.12 : -0.12)));
        return Number(next.toFixed(2));
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel as any);
  }, []);

  // Drag pan (mouse)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let dragging = false;
    let last = { x: 0, y: 0 };
    const down = (e: PointerEvent) => {
      if (lowBandwidth) return;
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
    };
    const up = () => { dragging = false; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [lowBandwidth]);

  // Very lightweight clustering: bucket pins into grid cells at current zoom.
  const clusters = useMemo(() => {
    if (lowBandwidth) return [];
    const cell = 28 / zoom;
    const byKey = new Map<string, { x: number; y: number; pins: MapPinRecord[] }>();
    for (const p of projectedPins) {
      const gx = Math.floor(p.x / cell);
      const gy = Math.floor(p.y / cell);
      const key = `${gx}:${gy}`;
      const existing = byKey.get(key);
      if (!existing) byKey.set(key, { x: (gx + 0.5) * cell, y: (gy + 0.5) * cell, pins: [p] });
      else existing.pins.push(p);
    }
    return [...byKey.values()];
  }, [projectedPins, zoom, lowBandwidth]);

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-[rgba(12,45,74,0.12)] bg-gradient-to-b from-[#f8f1df] via-[#f7f3ea] to-[#eaf3ff]"
        style={{ height: 620 }}
        role="application"
        aria-label="Interactive map of Namibia"
      >
        {/* Desert/Atlantic subtle texture layers */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(1200px 700px at 20% 30%, rgba(255, 214, 153, 0.35), transparent 60%)," +
              "radial-gradient(900px 650px at 10% 55%, rgba(52, 145, 235, 0.16), transparent 55%)," +
              "radial-gradient(900px 700px at 55% 70%, rgba(102, 187, 106, 0.12), transparent 60%)," +
              "linear-gradient(135deg, rgba(12, 45, 74, 0.05), transparent 55%)",
            mixBlendMode: "multiply",
          }}
        />

        {lowBandwidth ? (
          <div className="absolute inset-0 overflow-auto p-4">
            <p className="text-xs text-[rgba(12,45,74,0.65)]">
              Low-bandwidth mode is on. Showing a simplified pin list.
            </p>
            <ul className="mt-3 space-y-2">
              {pins.map((p) => (
                <li key={p.id} className="sn-card p-4">
                  <button type="button" onClick={() => onPinClick(p)} className="w-full text-left">
                    <p className="font-medium text-[var(--sn-blue)]">{p.pin_name}</p>
                    <p className="mt-1 text-xs text-[rgba(12,45,74,0.6)]">
                      {p.pin_type} · {p.region ?? "Unassigned"}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="absolute inset-0 h-full w-full"
            style={{ transform, transformOrigin: "0 0" }}
          >
            <g>
              {/* Regions */}
              {regionPaths.map((r) => (
                <path
                  key={r.key}
                  d={r.d}
                  fill={highContrast ? "rgba(12,45,74,0.05)" : "rgba(255,255,255,0.55)"}
                  stroke={highContrast ? "rgba(12,45,74,0.9)" : "rgba(12,45,74,0.25)"}
                  strokeWidth={highContrast ? 1.2 : 0.8}
                />
              ))}

              {/* Pins + clusters */}
              {clusters.map((c, i) => {
                if (c.pins.length === 1) {
                  const p = c.pins[0] as any;
                  const color = pinColor(p.pin_type);
                  const isHover = hoverId === p.id;
                  return (
                    <g
                      key={p.id}
                      transform={`translate(${p.x},${p.y})`}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      onClick={() => onPinClick(p)}
                      role="button"
                      aria-label={`${p.pin_name} (${p.pin_type})`}
                      tabIndex={0 as any}
                    >
                      <circle r={isHover ? 9 : 7} fill={color} opacity={0.95} />
                      <circle r={isHover ? 14 : 11} fill={color} opacity={0.18} />
                    </g>
                  );
                }

                return (
                  <g
                    key={`c-${i}`}
                    transform={`translate(${c.x},${c.y})`}
                    onClick={() => onPinClick(c.pins[0])}
                    role="button"
                    aria-label={`Cluster of ${c.pins.length} pins`}
                    tabIndex={0 as any}
                  >
                    <circle r={14} fill="rgba(12,45,74,0.9)" />
                    <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#fff" fontFamily="ui-sans-serif">
                      {c.pins.length}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[rgba(12,45,74,0.7)]">
        <span className="rounded-full border border-[rgba(12,45,74,0.12)] bg-white px-3 py-1">Zoom: {zoom.toFixed(2)}×</span>
        <button
          type="button"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="rounded-full border border-[rgba(12,45,74,0.12)] bg-white px-3 py-1 hover:bg-[rgba(255,255,255,0.9)]"
        >
          Reset view
        </button>
        <span className="rounded-full border border-[rgba(12,45,74,0.12)] bg-white px-3 py-1">
          Types: {MAP_PIN_TYPES.length}
        </span>
      </div>
    </div>
  );
}

