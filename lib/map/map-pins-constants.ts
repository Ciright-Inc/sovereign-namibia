import type { AdminRole } from "@/lib/admin-rbac";

export const MAP_PIN_TYPES = [
  "Power Plant",
  "Port",
  "Airport",
  "Bank",
  "Telecom Site",
  "Data Center",
  "Government Office",
  "Hospital",
  "School",
  "Water Infrastructure",
  "Agriculture Hub",
  "Tourism Site",
  "Emergency Service",
  "Community Center",
  "Business",
  "Verified Organization",
  "Verified Community Project",
  "Regional Development Project",
] as const;

export type MapPinType = (typeof MAP_PIN_TYPES)[number];

export const MAP_PIN_VERIFICATION_STATUSES = [
  "pending",
  "verified",
  "rejected",
  "needs_more_info",
] as const;

export type MapPinVerificationStatus = (typeof MAP_PIN_VERIFICATION_STATUSES)[number];

export const MAP_PIN_CORRECTION_STATUSES = [
  "none",
  "submitted",
  "in_review",
  "approved",
  "rejected",
] as const;

export type MapPinCorrectionStatus = (typeof MAP_PIN_CORRECTION_STATUSES)[number];

export const MAP_PIN_FEEDBACK_STATUSES = ["open", "triaged", "resolved"] as const;
export type MapPinFeedbackStatus = (typeof MAP_PIN_FEEDBACK_STATUSES)[number];

export type MapPinVisibilityRules = {
  public?: boolean;
  restrictedReason?: string;
  allowPreciseCoordinates?: boolean;
  showOnLowBandwidthList?: boolean;
};

export function getDefaultVisibilityRules(pinType: string): MapPinVisibilityRules {
  // Default requested by user: public by default; restrict Water Infrastructure.
  const restrictedTypes = new Set(["Water Infrastructure"]);
  if (restrictedTypes.has(pinType)) {
    return {
      public: false,
      restrictedReason: "Safety-sensitive infrastructure. Public visibility requires review.",
      allowPreciseCoordinates: false,
      showOnLowBandwidthList: false,
    };
  }
  return {
    public: true,
    allowPreciseCoordinates: true,
    showOnLowBandwidthList: true,
  };
}

export function canSeeRestrictedPins(role?: AdminRole | string): boolean {
  return role === "Super Admin" || role === "Security Officer";
}

