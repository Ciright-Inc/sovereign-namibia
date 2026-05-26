import type { RegistryEntityType } from "@/lib/admin-rbac";

export type EntityFieldDef = {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "email" | "url" | "array" | "json";
  required?: boolean;
};

export const ENTITY_CATEGORIES: Record<RegistryEntityType, string[]> = {
  government: [
    "Ministry",
    "Government Office",
    "Regulator",
    "Court",
    "Municipality",
    "Public Agency",
    "State-Owned Enterprise",
    "Department",
    "Commission",
    "Authority",
  ],
  banking: [
    "Commercial Bank",
    "Investment Bank",
    "Development Bank",
    "Microfinance",
    "Payment Platform",
    "Mobile Money Platform",
  ],
  healthcare: ["Hospital", "Clinic", "Medical Center", "Laboratory", "Pharmacy", "Healthcare Authority"],
  infrastructure: [
    "Energy Infrastructure",
    "Stock Exchange",
    "Telecom Infrastructure",
    "Utility",
    "Port",
    "Airport",
    "Rail",
    "Water Infrastructure",
    "Data Center",
  ],
  business: ["Manufacturing", "Retail", "Services", "Mining", "Agriculture", "Technology", "Finance"],
  citizen: ["Citizen Record"],
};

export const ENTITY_METADATA_FIELDS: Record<RegistryEntityType, EntityFieldDef[]> = {
  government: [
    { key: "minister", label: "Minister / Director", type: "text" },
    { key: "departments", label: "Departments", type: "array" },
    { key: "employees", label: "Employees", type: "number" },
    { key: "public_services", label: "Public Services", type: "array" },
    { key: "regulatory_authority", label: "Regulatory Authority", type: "text" },
    { key: "related_entities", label: "Related Entities", type: "array" },
    { key: "public_apis", label: "Public APIs", type: "array" },
  ],
  banking: [
    { key: "swift", label: "SWIFT Code", type: "text" },
    { key: "branches", label: "Branches", type: "number" },
    { key: "executives", label: "Executives", type: "array" },
    { key: "financial_licenses", label: "Financial Licenses", type: "array" },
    { key: "regulatory_relationships", label: "Regulatory Relationships", type: "array" },
    { key: "digital_banking", label: "Digital Banking Services", type: "array" },
    { key: "mobile_apps", label: "Mobile Apps", type: "array" },
  ],
  healthcare: [
    { key: "ownership", label: "Ownership", type: "text" },
    { key: "beds", label: "Beds", type: "number" },
    { key: "doctors", label: "Doctors", type: "number" },
    { key: "staff", label: "Staff", type: "number" },
    { key: "emergency_services", label: "Emergency Services", type: "boolean" },
    { key: "regulatory_status", label: "Regulatory Status", type: "text" },
    { key: "insurance_relationships", label: "Insurance Relationships", type: "array" },
  ],
  infrastructure: [
    { key: "operator", label: "Operator", type: "text" },
    { key: "capacity", label: "Capacity", type: "text" },
    { key: "criticality_rating", label: "Criticality Rating", type: "text" },
    { key: "service_areas", label: "Service Areas", type: "array" },
    { key: "operational_metrics", label: "Operational Metrics", type: "json" },
    { key: "linked_systems", label: "Linked Systems", type: "array" },
  ],
  business: [
    { key: "registration_number", label: "Registration Number", type: "text", required: true },
    { key: "tax_id", label: "Tax ID", type: "text" },
    { key: "industry", label: "Industry", type: "text" },
    { key: "employees", label: "Employees", type: "number" },
    { key: "directors", label: "Directors", type: "array" },
    { key: "ownership_structure", label: "Ownership Structure", type: "json" },
    { key: "licenses", label: "Licenses", type: "array" },
    { key: "compliance_status", label: "Compliance Status", type: "text" },
  ],
  citizen: [
    { key: "national_id", label: "National ID", type: "text", required: true },
    { key: "date_of_birth", label: "Date of Birth", type: "text" },
    { key: "employment", label: "Employment", type: "text" },
    { key: "digital_identity_status", label: "Digital Identity Status", type: "text" },
    { key: "sim_verification", label: "SIM Verification", type: "text" },
    { key: "linked_businesses", label: "Linked Businesses", type: "array" },
    { key: "linked_government_services", label: "Linked Government Services", type: "array" },
    { key: "consent_status", label: "Consent Status", type: "text" },
  ],
};

export const NAMIBIA_PROVINCES = [
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
];
