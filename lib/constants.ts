export const ACCOUNT_STATES = [
  "Pre-Created",
  "Unclaimed",
  "Claim Started",
  "Mobile Verified",
  "KYC Pending",
  "KYC Approved",
  "Active",
  "Suspended",
  "Locked",
  "Deceased",
  "Duplicate Review",
  "Fraud Review",
] as const;

export type AccountState = (typeof ACCOUNT_STATES)[number];

export const KYC_STATUSES = [
  "Not Started",
  "In Progress",
  "Documents Uploaded",
  "Awaiting Telecom Verification",
  "Awaiting Admin Review",
  "Approved",
  "Rejected",
  "More Information Required",
  "Suspended",
  "Locked",
] as const;

export type KycStatus = (typeof KYC_STATUSES)[number];

export const ADMIN_ROLES = [
  "Super Admin",
  "KYC Reviewer",
  "CMS Editor",
  "News Moderator",
  "Telecom Admin",
  "Security Officer",
  "Support Agent",
  "Government Observer",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const SUBDOMAINS = {
  main: "",
  kyc: "kyc",
  citizen: "citizen",
  news: "news",
  services: "services",
  admin: "admin",
  api: "api",
  support: "support",
  status: "status",
} as const;

export type SubdomainKey = keyof typeof SUBDOMAINS;

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "sovereignnamibia.com";

export const KYC_STEPS = [
  { id: 1, key: "personal", label: "Personal Information" },
  { id: 2, key: "mobile", label: "Mobile Verification" },
  { id: 3, key: "documents", label: "Document Upload" },
  { id: 4, key: "selfie", label: "Selfie / Liveness Check" },
  { id: 5, key: "address", label: "Address Confirmation" },
  { id: 6, key: "telecom", label: "Telecom SIM/eSIM Verification" },
  { id: 7, key: "review", label: "Review" },
  { id: 8, key: "approval", label: "Approval" },
] as const;

export const DOCUMENT_TYPES = [
  "National ID",
  "Driver License",
  "Passport",
  "Residence Proof",
  "Telecom Account",
] as const;

export const ACCOUNT_TYPES = [
  { id: "individual", label: "Individual" },
  { id: "business", label: "Business" },
  { id: "government", label: "Government Ministry / Department" },
  { id: "government_office", label: "Government Office / Regulator / Court" },
  { id: "healthcare", label: "Healthcare Facility" },
  { id: "financial", label: "Bank / Financial Institution" },
  { id: "utility", label: "Utility / National Infrastructure Entity" },
] as const;

export type AccountTypeId = (typeof ACCOUNT_TYPES)[number]["id"];

export const NAMIBIA_REGIONS = [
  "Erongo",
  "Hardap",
  "Karas",
  "Kavango East",
  "Kavango West",
  "Khomas",
  "Kunene",
  "Ohangwena",
  "Omaheke",
  "Omusati",
  "Oshana",
  "Oshikoto",
  "Otjozondjupa",
  "Zambezi",
] as const;

export const PENDING_VERIFICATION_STATUSES = [
  "Pending",
  "Approved",
  "Rejected",
  "More Information Required",
  "Duplicate Review",
  "Suspicious",
] as const;

export const REVIEW_STATUSES = ["Unreviewed", "In Review", "Completed"] as const;
