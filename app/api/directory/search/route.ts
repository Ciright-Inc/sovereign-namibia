import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { searchDirectory } from "@/lib/directory-service";
import { checkRateLimit, getClientInfo } from "@/lib/rate-limit";

const schema = z.object({
  fullLegalName: z.string().min(2),
  mobileNumber: z.string().min(8),
  dateOfBirth: z.string().min(1),
  nationalId: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const { ip, userAgent } = getClientInfo(request);
  const rate = await checkRateLimit(request, "directory.search", 20);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const input = schema.parse(body);
    const result = await searchDirectory(
      {
        ...input,
        email: input.email || undefined,
      },
      { ip, userAgent }
    );
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid search parameters." }, { status: 400 });
    }
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }
}
