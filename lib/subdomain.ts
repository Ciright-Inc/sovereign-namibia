import { ROOT_DOMAIN, SUBDOMAINS, type SubdomainKey } from "@/lib/constants";

export function getSubdomainFromHost(host: string): SubdomainKey {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  const root = ROOT_DOMAIN.toLowerCase();

  if (hostname === root || hostname === "localhost" || hostname === "127.0.0.1") {
    return "main";
  }

  if (hostname.endsWith(`.${root}`)) {
    const sub = hostname.replace(`.${root}`, "");
    const match = Object.entries(SUBDOMAINS).find(([, value]) => value === sub);
    if (match) return match[0] as SubdomainKey;
  }

  if (hostname.startsWith("localhost") && hostname.includes(".")) {
    const sub = hostname.split(".")[0];
    const match = Object.entries(SUBDOMAINS).find(([, value]) => value === sub);
    if (match) return match[0] as SubdomainKey;
  }

  return "main";
}

export function subdomainPath(subdomain: SubdomainKey): string {
  if (subdomain === "main") return "";
  return `/${subdomain}`;
}

export const SUBDOMAIN_LABELS: Record<SubdomainKey, string> = {
  main: "Sovereign Namibia",
  kyc: "Identity Verification",
  citizen: "Citizen Portal",
  news: "News & Notices",
  services: "Government Services",
  admin: "Administration",
  api: "API Gateway",
  support: "Support Center",
  status: "System Status",
};
