import { NextRequest, NextResponse } from "next/server";
import { getPublishedPage } from "@/lib/cms-service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const page = await getPublishedPage(slug);
  if (!page) {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }
  return NextResponse.json(page);
}
