import type { AccountTypeId, KycStatus } from "@/lib/constants";

type DemoKycEntry = { status: KycStatus; step: number; data: Record<string, unknown> };
type DemoClaimEntry = {
  otpHash: string;
  expires: number;
  mobileVerified: boolean;
  recordId: string;
};

export type DemoUser = {
  id: string;
  mobile: string;
  accountState: string;
  accountType: AccountTypeId | null;
  profileData: Record<string, unknown> | null;
  registryConsent: boolean;
};

export type DemoOtpChallenge = {
  otpHash: string;
  expires: number;
  attempts: number;
  verified: boolean;
  userId: string;
  mobile: string;
};

type DemoStore = {
  kyc: Map<string, DemoKycEntry>;
  claims: Map<string, DemoClaimEntry>;
  otpChallenges: Map<string, DemoOtpChallenge>;
  users: Map<string, DemoUser>;
  sessions: Map<string, string>;
  pendingVerifications: Map<string, Record<string, unknown>>;
  securityEvents: Array<Record<string, unknown>>;
};

const globalForDemo = globalThis as unknown as { snDemoStore?: DemoStore };

function getDemoStore(): DemoStore {
  if (!globalForDemo.snDemoStore) {
    globalForDemo.snDemoStore = {
      kyc: new Map(),
      claims: new Map(),
      otpChallenges: new Map(),
      users: new Map(),
      sessions: new Map(),
      pendingVerifications: new Map(),
      securityEvents: [],
    };
  }
  return globalForDemo.snDemoStore;
}

export function getDemoKycStore() {
  return getDemoStore().kyc;
}

export function getDemoClaimsStore() {
  return getDemoStore().claims;
}

export function getDemoOtpStore() {
  return getDemoStore().otpChallenges;
}

export function getDemoUsersStore() {
  return getDemoStore().users;
}

export function getDemoSessionsStore() {
  return getDemoStore().sessions;
}

export function getDemoPendingStore() {
  return getDemoStore().pendingVerifications;
}

export function getDemoSecurityEvents() {
  return getDemoStore().securityEvents;
}
