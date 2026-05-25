import { NextRequest, NextResponse } from "next/server";
import { getSubdomainFromHost, subdomainPath } from "@/lib/subdomain";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const devSubdomain = request.nextUrl.searchParams.get("subdomain");
  const subdomain = devSubdomain
    ? (devSubdomain as ReturnType<typeof getSubdomainFromHost>)
    : getSubdomainFromHost(host);

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const prefix = subdomainPath(subdomain as Parameters<typeof subdomainPath>[0]);

  if (subdomain === "api" && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/api-gateway";
    const response = NextResponse.rewrite(url);
    response.headers.set("x-sn-subdomain", subdomain);
    return response;
  }

  const rewritePath = prefix ? `${prefix}${pathname === "/" ? "" : pathname}` : pathname;

  if (subdomain !== "main" && !pathname.startsWith(prefix)) {
    const url = request.nextUrl.clone();
    url.pathname = rewritePath || `/${subdomain}`;
    const response = NextResponse.rewrite(url);
    response.headers.set("x-sn-subdomain", subdomain);
    return response;
  }

  const response = NextResponse.next();
  response.headers.set("x-sn-subdomain", subdomain);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
