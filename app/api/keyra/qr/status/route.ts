import { NextRequest, NextResponse } from "next/server";
import { KeyraQrPairing } from "@/services/keyra/keyraQrPairing";
import { getCitizenAccountState } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing pairing token." }, { status: 400 });
  }

  const status = await KeyraQrPairing.getPairingStatus(token);
  if (status.status === "not_found") {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  let profileComplete = false;
  let accountType: string | null = null;
  if (status.user_id) {
    const account = await getCitizenAccountState(status.user_id);
    profileComplete = account.profileComplete;
    accountType = account.accountType;
  }

  return NextResponse.json({
    ...status,
    profileComplete,
    accountType,
  });
}
