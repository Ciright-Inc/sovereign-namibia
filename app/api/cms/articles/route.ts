import { NextResponse } from "next/server";
import { getPublishedArticles } from "@/lib/cms-service";

export async function GET() {
  const articles = await getPublishedArticles(50);
  return NextResponse.json({ articles });
}
