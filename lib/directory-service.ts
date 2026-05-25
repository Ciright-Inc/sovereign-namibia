import { DirectoryMatchResult, toDirectoryMatch } from "@/lib/masking";
import { encrypt, hashValue, decrypt } from "@/lib/crypto";
import { isDatabaseReady, query } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";

export type DirectorySearchInput = {
  fullLegalName: string;
  mobileNumber: string;
  dateOfBirth: string;
  nationalId?: string;
  email?: string;
};

const DEMO_RECORDS = [
  {
    id: "11111111-1111-4111-8111-111111111001",
    legalName: "Johannes Chirongo",
    mobile: "+264811234441",
    email: "johannes.chirongo@email.na",
    region: "Khomas",
    accountState: "Unclaimed",
    dob: "1985-03-15",
    nationalId: "85031500123",
  },
  {
    id: "11111111-1111-4111-8111-111111111002",
    legalName: "Maria Nghidinwa",
    mobile: "+264812345678",
    email: "maria.n@email.na",
    region: "Erongo",
    accountState: "Unclaimed",
    dob: "1990-07-22",
    nationalId: "90072200456",
  },
  {
    id: "11111111-1111-4111-8111-111111111003",
    legalName: "Petrus Shilongo",
    mobile: "+264813456789",
    email: null,
    region: "Oshana",
    accountState: "Pre-Created",
    dob: "1978-11-08",
    nationalId: "78110800789",
  },
];

function demoSearch(input: DirectorySearchInput): DirectoryMatchResult[] {
  const nameHash = hashValue(input.fullLegalName);
  const mobileHash = hashValue(input.mobileNumber.replace(/\D/g, ""));

  return DEMO_RECORDS.filter((record) => {
    const recordNameHash = hashValue(record.legalName);
    const recordMobileHash = hashValue(record.mobile.replace(/\D/g, ""));
    const nameMatch = recordNameHash === nameHash;
    const mobileMatch = recordMobileHash === mobileHash;
    const dobMatch = record.dob === input.dateOfBirth;
    if (!nameMatch || !mobileMatch || !dobMatch) return false;
    if (input.nationalId && !record.nationalId.endsWith(input.nationalId.slice(-4))) {
      return false;
    }
    return true;
  }).map((record) =>
    toDirectoryMatch(
      record.id,
      record.legalName,
      record.mobile,
      record.email,
      record.region,
      record.accountState
    )
  );
}

export async function searchDirectory(
  input: DirectorySearchInput,
  auditContext?: { ip?: string | null; userAgent?: string | null }
): Promise<{ matches: DirectoryMatchResult[]; message: string }> {
  const dbReady = await isDatabaseReady();

  if (!dbReady) {
    const matches = demoSearch(input);
    return {
      matches,
      message:
        matches.length > 0
          ? "We found a possible citizen identity record."
          : "No matching citizen identity record was found.",
    };
  }

  const nameHash = hashValue(input.fullLegalName);

  const result = await query<{
    id: string;
    legal_name_encrypted: Buffer;
    mobile_encrypted: Buffer | null;
    email_encrypted: Buffer | null;
    region: string | null;
    account_state: string;
    date_of_birth_encrypted: Buffer | null;
    national_id_last4: string | null;
  }>(
    `SELECT id, legal_name_encrypted, mobile_encrypted, email_encrypted, region, account_state,
            date_of_birth_encrypted, national_id_last4
     FROM sn_citizen_directory_records
     WHERE legal_name_search_hash = $1`,
    [nameHash]
  );

  const matches: DirectoryMatchResult[] = [];

  for (const row of result.rows) {
    const legalName = decrypt(row.legal_name_encrypted);
    const mobile = row.mobile_encrypted ? decrypt(row.mobile_encrypted) : null;
    const email = row.email_encrypted ? decrypt(row.email_encrypted) : null;
    const dob = row.date_of_birth_encrypted ? decrypt(row.date_of_birth_encrypted) : null;

    const mobileNorm = input.mobileNumber.replace(/\D/g, "");
    const recordMobileNorm = mobile?.replace(/\D/g, "") ?? "";
    if (mobileNorm !== recordMobileNorm) continue;
    if (dob !== input.dateOfBirth) continue;
    if (input.nationalId && row.national_id_last4 !== input.nationalId.slice(-4)) continue;

    matches.push(
      toDirectoryMatch(row.id, legalName, mobile, email, row.region, row.account_state)
    );
  }

  await writeAuditLog({
    actorType: "citizen",
    action: "directory.search",
    resourceType: "directory",
    metadata: { matchCount: matches.length },
    ipAddress: auditContext?.ip ?? undefined,
    userAgent: auditContext?.userAgent ?? undefined,
  });

  return {
    matches,
    message:
      matches.length > 0
        ? "We found a possible citizen identity record."
        : "No matching citizen identity record was found.",
  };
}

export async function seedDemoDirectoryRecord(record: (typeof DEMO_RECORDS)[0]) {
  if (!(await isDatabaseReady())) return;

  await query(
    `INSERT INTO sn_citizen_directory_records
      (id, legal_name_encrypted, legal_name_search_hash, date_of_birth_encrypted,
       national_id_encrypted, national_id_last4, mobile_encrypted, email_encrypted,
       region, account_state)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT DO NOTHING`,
    [
      record.id,
      encrypt(record.legalName),
      hashValue(record.legalName),
      encrypt(record.dob),
      encrypt(record.nationalId),
      record.nationalId.slice(-4),
      encrypt(record.mobile),
      record.email ? encrypt(record.email) : null,
      record.region,
      record.accountState,
    ]
  );
}

export { DEMO_RECORDS };
