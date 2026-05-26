import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchDirectory } from "@/lib/directory-service";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";
import { getCitizenSession, getCitizenAccountState } from "@/lib/auth";
import { isNamibiaIpAccess } from "@/lib/geo";
import { normalizeNamibiaMobile } from "@/lib/namibia";
import { createPendingVerification } from "@/lib/account-auth-service";
import type { AccountTypeId } from "@/lib/constants";

const schema = z.object({
  fullLegalName: z.string().min(2).optional(),
  mobileNumber: z.string().min(8).optional(),
  dateOfBirth: z.string().optional(),
  nationalId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  businessName: z.string().optional(),
  registrationNumber: z.string().optional(),
  domain: z.string().optional(),
  agencyName: z.string().optional(),
  registryConsent: z.literal(true),
  accountType: z.string().optional(),
  submittedProfile: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const geo = isNamibiaIpAccess(request);
  if (!geo.allowed) {
    return NextResponse.json(
      {
        error:
          geo.reason ??
          "Access to Sovereign Namibia Registry is currently restricted to Namibia-based users.",
      },
      { status: 403 }
    );
  }

  const session = await getCitizenSession();
  if (!session?.userId || session.type !== "citizen") {
    return NextResponse.json(
      { error: "You must verify your Namibia mobile number before searching the registry." },
      { status: 401 }
    );
  }

  const account = await getCitizenAccountState(session.userId);
  if (account.accountState !== "Mobile Verified" && account.accountState !== "Active") {
    return NextResponse.json(
      { error: "Complete mobile verification before searching the registry." },
      { status: 403 }
    );
  }

  if (!account.profileComplete) {
    return NextResponse.json(
      { error: "Complete your account profile before searching the registry." },
      { status: 403 }
    );
  }

  const { ip, userAgent, deviceFingerprint } = getClientInfo(request);
  const rate = await checkRateLimit(request, "directory.search", 20);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const input = schema.parse(body);

    if (input.mobileNumber) {
      const mobile = normalizeNamibiaMobile(input.mobileNumber);
      if (!mobile.ok) {
        return NextResponse.json({ error: mobile.error }, { status: 400 });
      }
      input.mobileNumber = mobile.e164;
    }

    const searchName =
      input.fullLegalName ??
      input.businessName ??
      input.agencyName ??
      String(input.submittedProfile?.fullLegalName ?? input.submittedProfile?.businessLegalName ?? "");

    if (!searchName || searchName.length < 2) {
      return NextResponse.json({ error: "Provide a searchable name or entity identifier." }, { status: 400 });
    }

    const result = await searchDirectory(
      {
        fullLegalName: searchName,
        mobileNumber: input.mobileNumber ?? "",
        dateOfBirth: input.dateOfBirth ?? "",
        nationalId: input.nationalId || undefined,
        email: input.email || undefined,
      },
      { ip, userAgent, actorId: session.userId }
    );

    if ((result.matches?.length ?? 0) === 0 && input.submittedProfile && input.accountType) {
      const pending = await createPendingVerification(
        session.userId,
        input.accountType as AccountTypeId,
        input.submittedProfile,
        input,
        { ip, userAgent, deviceFingerprint, country: geo.country }
      );

      return NextResponse.json({
        matches: [],
        message:
          "No verified registry record was found. We will index your submitted information for verification.",
        pendingVerificationId: pending.pendingId,
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid search parameters or missing registry consent." }, { status: 400 });
    }
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
