export function maskName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts
    .map((part) => {
      if (part.length <= 1) return `${part}***`;
      return `${part[0]}${"*".repeat(Math.min(part.length - 1, 7))}`;
    })
    .join(" ");
}

export function maskMobile(mobile: string): string {
  const digits = mobile.replace(/\D/g, "");
  if (digits.length < 4) return "+264 *** *** ***";
  const last3 = digits.slice(-3);
  return `+264 *** *** ${last3}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***";
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function maskNationalId(id: string): string {
  const cleaned = id.replace(/\s/g, "");
  if (cleaned.length <= 4) return "****";
  return `${"*".repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
}

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export type DirectoryMatchResult = {
  id: string;
  initials: string;
  maskedName: string;
  maskedMobile: string | null;
  maskedEmail: string | null;
  region: string | null;
  accountStatus: string;
};

export function toDirectoryMatch(
  id: string,
  legalName: string,
  mobile: string | null,
  email: string | null,
  region: string | null,
  accountStatus: string
): DirectoryMatchResult {
  return {
    id,
    initials: getInitials(legalName),
    maskedName: maskName(legalName),
    maskedMobile: mobile ? maskMobile(mobile) : null,
    maskedEmail: email ? maskEmail(email) : null,
    region,
    accountStatus,
  };
}
