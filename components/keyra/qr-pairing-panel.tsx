"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { RefreshCw, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

type QrPairingPanelProps = {
  sessionId: string;
  apiHeaders: Record<string, string>;
  onPaired: (data: { userId?: string; profileComplete?: boolean; accountType?: string | null }) => void;
  track: (event: string, metadata?: Record<string, unknown>) => void;
};

export function QrPairingPanel({ sessionId, apiHeaders, onPaired, track }: QrPairingPanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"pending" | "scanned" | "paired" | "expired" | "loading">("loading");
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const createQr = useCallback(async () => {
    setLoading(true);
    setStatus("loading");
    try {
      const res = await fetch("/api/keyra/qr/create", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({
          session_id: sessionId,
          callback_url: typeof window !== "undefined" ? window.location.origin : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unable to generate QR code");

      setQrDataUrl(data.qrDataUrl);
      setPairingToken(data.pairingToken);
      setExpiresAt(data.expiresAt);
      setStatus("pending");
      await track("qr_generated");
    } catch (err) {
      setStatus("expired");
    } finally {
      setLoading(false);
    }
  }, [apiHeaders, sessionId, track]);

  useEffect(() => {
    createQr();
  }, [createQr]);

  useEffect(() => {
    if (!pairingToken || status === "paired" || status === "expired") return;

    const interval = setInterval(async () => {
      if (expiresAt && Date.now() > expiresAt) {
        setStatus("expired");
        await track("desktop_mobile_pairing_expired");
        return;
      }

      const res = await fetch(`/api/keyra/qr/status?token=${pairingToken}`, { headers: apiHeaders });
      const data = await res.json();

      if (data.status === "scanned") setStatus("scanned");
      if (data.status === "paired" && data.userId) {
        setStatus("paired");
        await track("desktop_mobile_pairing_completed");
        onPaired({
          userId: data.userId,
          profileComplete: data.profileComplete,
          accountType: data.accountType,
        });
      }
      if (data.status === "expired") setStatus("expired");
    }, 2500);

    return () => clearInterval(interval);
  }, [pairingToken, status, expiresAt, apiHeaders, onPaired, track]);

  return (
    <div className="sn-card space-y-6 p-6 sm:p-8 text-center">
      <div className="flex items-center justify-center gap-2 text-[var(--sn-blue)]">
        <Smartphone className="h-5 w-5" aria-hidden />
        <h2 className="font-semibold">Mobile certification required</h2>
      </div>

      <p className="sn-prose text-sm leading-relaxed">
        To protect sovereign identity, account creation must be certified from a Namibia mobile device.
        Scan this QR code with your phone to continue.
      </p>

      <div className="mx-auto flex h-56 w-56 items-center justify-center rounded-2xl border border-[rgba(12,45,74,0.12)] bg-white p-4">
        {qrDataUrl ? (
          <Image src={qrDataUrl} alt="KEYRA mobile verification QR code" width={200} height={200} unoptimized />
        ) : (
          <p className="text-sm text-[rgba(12,45,74,0.5)]">{loading ? "Generating…" : "QR unavailable"}</p>
        )}
      </div>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span
          className={`inline-flex h-2 w-2 rounded-full ${
            status === "paired"
              ? "bg-emerald-500"
              : status === "scanned"
                ? "bg-amber-400"
                : status === "expired"
                  ? "bg-red-400"
                  : "bg-blue-400 animate-pulse"
          }`}
        />
        <span className="capitalize text-[rgba(12,45,74,0.65)]">
          {status === "loading" ? "Preparing pairing…" : `Pairing: ${status}`}
        </span>
      </div>

      {expiresAt && status !== "expired" && (
        <p className="text-xs text-[rgba(12,45,74,0.45)]">
          Expires in {Math.max(0, Math.floor((expiresAt - Date.now()) / 1000))}s
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        className="mx-auto"
        disabled={loading}
        onClick={async () => {
          await track("qr_refreshed");
          await createQr();
        }}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        Refresh QR Code
      </Button>

      {status === "expired" && (
        <p className="text-sm text-red-700">Session timed out. Refresh the QR code to try again.</p>
      )}
    </div>
  );
}
