import { NextResponse } from "next/server";
import { getCitizenAccountState, getCitizenSession } from "@/lib/auth";

export async function GET() {
  const session = await getCitizenSession();
  if (!session?.userId || session.type !== "citizen") {
    return NextResponse.json({ authenticated: false });
  }

  const account = await getCitizenAccountState(session.userId);

  return NextResponse.json({
    authenticated: true,
    userId: session.userId,
    accountState: account.accountState,
    accountType: account.accountType,
    profileComplete: account.profileComplete,
  });
}
