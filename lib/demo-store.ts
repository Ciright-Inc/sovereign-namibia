import type { KycStatus } from "@/lib/constants";

type DemoKycEntry = { status: KycStatus; step: number; data: Record<string, unknown> };
type DemoClaimEntry = {
  otpHash: string;
  expires: number;
  mobileVerified: boolean;
  recordId: string;
};

type DemoStore = {
  kyc: Map<string, DemoKycEntry>;
  claims: Map<string, DemoClaimEntry>;
};

const globalForDemo = globalThis as unknown as { snDemoStore?: DemoStore };

function getDemoStore(): DemoStore {
  if (!globalForDemo.snDemoStore) {
    globalForDemo.snDemoStore = {
      kyc: new Map(),
      claims: new Map(),
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
