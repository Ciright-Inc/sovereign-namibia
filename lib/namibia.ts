/** Namibia mobile and access validation utilities */

const NAMIBIA_MOBILE_REGEX = /^\+264[0-9]{8,9}$/;

export type NamibiaMobileResult =
  | { ok: true; e164: string; digits: string }
  | { ok: false; error: string };

export function normalizeNamibiaMobile(input: string): NamibiaMobileResult {
  let raw = input.trim().replace(/[\s\-().]/g, "");

  if (raw.startsWith("00")) raw = `+${raw.slice(2)}`;
  if (raw.startsWith("264") && !raw.startsWith("+")) raw = `+${raw}`;
  if (raw.startsWith("0") && raw.length >= 9) raw = `+264${raw.slice(1)}`;
  if (!raw.startsWith("+")) raw = `+${raw}`;

  if (!NAMIBIA_MOBILE_REGEX.test(raw)) {
    return {
      ok: false,
      error: "Enter a valid Namibia mobile number starting with +264.",
    };
  }

  return { ok: true, e164: raw, digits: raw.replace(/\D/g, "") };
}

export function isNamibiaMobile(input: string): boolean {
  return normalizeNamibiaMobile(input).ok;
}

export function maskNationalId(nationalId: string): string {
  const digits = nationalId.replace(/\D/g, "");
  if (digits.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
}
