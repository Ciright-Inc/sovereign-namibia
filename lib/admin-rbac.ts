export const ADMIN_ROLES = [
  "Super Admin",
  "Registry Admin",
  "Data Entry Operator",
  "Read Only Analyst",
  "KYC Reviewer",
  "Security Officer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const PERMISSIONS = {
  "registry.read": ["Super Admin", "Registry Admin", "Data Entry Operator", "Read Only Analyst", "KYC Reviewer", "Security Officer"],
  "registry.write": ["Super Admin", "Registry Admin", "Data Entry Operator"],
  "registry.delete": ["Super Admin", "Registry Admin"],
  "search.global": ["Super Admin", "Registry Admin", "Data Entry Operator", "Read Only Analyst", "Security Officer"],
  "import.data": ["Super Admin", "Registry Admin", "Data Entry Operator"],
  "audit.read": ["Super Admin", "Registry Admin", "Security Officer", "Read Only Analyst"],
  "access.manage": ["Super Admin"],
  "api.manage": ["Super Admin", "Registry Admin"],
  "settings.manage": ["Super Admin"],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const allowed = PERMISSIONS[permission] as readonly string[];
  return allowed.includes(role);
}

export const REGISTRY_ENTITY_TYPES = [
  { id: "government", label: "Government Registry", path: "/admin/government" },
  { id: "banking", label: "Banking Registry", path: "/admin/banking" },
  { id: "healthcare", label: "Healthcare Registry", path: "/admin/healthcare" },
  { id: "infrastructure", label: "Infrastructure Registry", path: "/admin/infrastructure" },
  { id: "business", label: "Business Registry", path: "/admin/business" },
  { id: "citizen", label: "Citizen Registry", path: "/admin/citizens" },
] as const;

export type RegistryEntityType = (typeof REGISTRY_ENTITY_TYPES)[number]["id"];

export const ADMIN_NAV = [
  { href: "/admin/dashboard", label: "Dashboard", permission: "registry.read" as Permission },
  { href: "/admin/government", label: "Government Registry", permission: "registry.read" as Permission },
  { href: "/admin/banking", label: "Banking Registry", permission: "registry.read" as Permission },
  { href: "/admin/healthcare", label: "Healthcare Registry", permission: "registry.read" as Permission },
  { href: "/admin/infrastructure", label: "Infrastructure Registry", permission: "registry.read" as Permission },
  { href: "/admin/business", label: "Business Registry", permission: "registry.read" as Permission },
  { href: "/admin/citizens", label: "Citizen Registry", permission: "registry.read" as Permission },
  { href: "/admin/search", label: "Search Engine", permission: "search.global" as Permission },
  { href: "/admin/imports", label: "Data Imports", permission: "import.data" as Permission },
  { href: "/admin/audit", label: "Audit Logs", permission: "audit.read" as Permission },
  { href: "/admin/access", label: "Access Management", permission: "access.manage" as Permission },
  { href: "/admin/api", label: "API Management", permission: "api.manage" as Permission },
  { href: "/admin/settings", label: "Settings", permission: "settings.manage" as Permission },
];
