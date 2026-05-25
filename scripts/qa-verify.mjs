#!/usr/bin/env node
const BASE = process.env.QA_BASE ?? "http://localhost:3010";

const results = [];
let cookieHeader = "";

async function req(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...(options.headers ?? {}),
    },
  });

  const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  if (setCookies.length > 0) {
    cookieHeader = setCookies.map((c) => c.split(";")[0]).join("; ");
  }

  let body = null;
  const text = await res.text();
  try {
    body = JSON.parse(text);
  } catch {
    body = text.slice(0, 200);
  }
  return { status: res.status, body, headers: res.headers };
}

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
}

function assert(name, condition, detail = "") {
  if (condition) pass(name, detail);
  else fail(name, detail);
}

async function main() {
  console.log(`\nSovereign Namibia QA — ${BASE}\n`);

  // Health & API
  const health = await req("/api/health");
  assert("GET /api/health", health.status === 200, `status=${health.status}`);
  assert(
    "Database connected",
    health.body?.database === true,
    health.body?.database ? "connected" : "demo_mode"
  );

  const apiIndex = await req("/api");
  assert("GET /api index", apiIndex.status === 200 && apiIndex.body?.name, apiIndex.body?.database);
  assert("API index — database mode", apiIndex.body?.database === "connected", apiIndex.body?.database);

  // Pages
  const pages = [
    "/",
    "/find-account",
    "/claim?recordId=demo-001",
    "/register",
    "/kyc",
    "/kyc?kycId=demo-kyc",
    "/citizen",
    "/news",
    "/services",
    "/support",
    "/status",
    "/admin",
    "/admin/dashboard",
    "/admin/cms",
    "/admin/kyc",
    "/admin/directory",
    "/legal/privacy",
    "/legal/terms",
    "/legal/rights",
    "/api-gateway",
  ];

  for (const p of pages) {
    const r = await req(p, { method: "GET", headers: {} });
    assert(`GET ${p}`, r.status === 200, `HTTP ${r.status}`);
  }

  // Subdomain query rewrites
  for (const sub of ["kyc", "citizen", "news", "services", "admin", "support", "status"]) {
    const r = await req(`/?subdomain=${sub}`, { method: "GET", headers: {} });
    assert(`Subdomain ?subdomain=${sub}`, r.status === 200, `HTTP ${r.status}`);
  }

  // Directory search — valid match
  const searchOk = await req("/api/directory/search", {
    method: "POST",
    body: JSON.stringify({
      fullLegalName: "Johannes Chirongo",
      mobileNumber: "+264811234441",
      dateOfBirth: "1985-03-15",
    }),
  });
  assert("Directory search — valid match", searchOk.status === 200, `HTTP ${searchOk.status}`);
  assert(
    "Directory search — returns match",
    searchOk.body?.matches?.length === 1,
    `matches=${searchOk.body?.matches?.length}`
  );
  assert(
    "Directory search — masks name",
    searchOk.body?.matches?.[0]?.maskedName?.includes("*"),
    searchOk.body?.matches?.[0]?.maskedName
  );
  assert(
    "Directory search — no full mobile",
    !String(searchOk.body?.matches?.[0]?.maskedMobile ?? "").includes("811234441"),
    searchOk.body?.matches?.[0]?.maskedMobile
  );

  // Directory search — no match
  const searchNone = await req("/api/directory/search", {
    method: "POST",
    body: JSON.stringify({
      fullLegalName: "Nobody Here",
      mobileNumber: "+264800000000",
      dateOfBirth: "2000-01-01",
    }),
  });
  assert("Directory search — no match", searchNone.body?.matches?.length === 0);

  // Directory search — invalid
  const searchBad = await req("/api/directory/search", {
    method: "POST",
    body: JSON.stringify({ fullLegalName: "A" }),
  });
  assert("Directory search — validation", searchBad.status === 400, `HTTP ${searchBad.status}`);

  // Second demo record
  const searchMaria = await req("/api/directory/search", {
    method: "POST",
    body: JSON.stringify({
      fullLegalName: "Maria Nghidinwa",
      mobileNumber: "+264812345678",
      dateOfBirth: "1990-07-22",
    }),
  });
  assert("Directory search — Maria", searchMaria.body?.matches?.length === 1);

  // Claim flow — use record id from directory search (works in demo + DB mode)
  const recordId = searchOk.body?.matches?.[0]?.id;
  assert("Directory search — record id present", !!recordId, recordId);

  const claimStart = await req("/api/claim/start", {
    method: "POST",
    body: JSON.stringify({ directoryRecordId: recordId, mobile: "+264811234441" }),
  });
  assert("Claim start", claimStart.status === 200 && claimStart.body?.claimId, claimStart.body?.claimId);
  const claimId = claimStart.body?.claimId;
  const devOtp = claimStart.body?.devOtp;

  const claimBadOtp = await req("/api/claim/verify-otp", {
    method: "POST",
    body: JSON.stringify({ claimId, otp: "000000" }),
  });
  assert("Claim OTP — rejects invalid", claimBadOtp.status === 400 || claimBadOtp.body?.success === false);

  const claimOtp = await req("/api/claim/verify-otp", {
    method: "POST",
    body: JSON.stringify({ claimId, otp: devOtp }),
  });
  assert("Claim OTP — verifies", claimOtp.body?.success === true, claimOtp.body?.message);

  const claimComplete = await req("/api/claim/complete", {
    method: "POST",
    body: JSON.stringify({ claimId, recordId }),
  });
  assert("Claim complete", claimComplete.status === 200 && claimComplete.body?.kycId, claimComplete.body?.kycId);
  const kycId = claimComplete.body?.kycId;

  // KYC
  const kycGet = await req(`/api/kyc/${kycId}`);
  assert("KYC get", kycGet.status === 200 && kycGet.body?.steps?.length === 8, kycGet.body?.status);

  const kycPersonal = await req(`/api/kyc/${kycId}/step`, {
    method: "POST",
    body: JSON.stringify({
      step: "personal",
      data: { fullLegalName: "Johannes Chirongo", dateOfBirth: "1985-03-15", nationalId: "85031500123" },
    }),
  });
  assert("KYC step — personal", kycPersonal.body?.success === true, kycPersonal.body?.status);

  const kycMobile = await req(`/api/kyc/${kycId}/step`, {
    method: "POST",
    body: JSON.stringify({ step: "mobile", data: { mobile: "+264811234441" } }),
  });
  assert("KYC step — mobile", kycMobile.body?.success === true);

  const kycDocs = await req(`/api/kyc/${kycId}/step`, {
    method: "POST",
    body: JSON.stringify({ step: "documents", data: { documentType: "National ID", frontUploaded: true } }),
  });
  assert("KYC step — documents", kycDocs.body?.status === "Documents Uploaded");

  const kycTelecom = await req(`/api/kyc/${kycId}/step`, {
    method: "POST",
    body: JSON.stringify({ step: "telecom", data: { simType: "SIM" } }),
  });
  assert("KYC step — telecom", kycTelecom.body?.status === "Awaiting Telecom Verification");

  const kycReview = await req(`/api/kyc/${kycId}/step`, {
    method: "POST",
    body: JSON.stringify({ step: "review", data: { submitted: true } }),
  });
  assert("KYC step — review", kycReview.body?.status === "Awaiting Admin Review");

  // CMS
  const cmsPage = await req("/api/cms/pages/home");
  assert("CMS page home", cmsPage.status === 200 && cmsPage.body?.slug === "home");

  const cmsArticles = await req("/api/cms/articles");
  assert("CMS articles", cmsArticles.status === 200 && cmsArticles.body?.articles?.length > 0, `${cmsArticles.body?.articles?.length} articles`);

  // Register
  const register = await req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      fullLegalName: "QA Test User",
      mobileNumber: "+264811111111",
      email: "qa@test.na",
      dateOfBirth: "1995-05-05",
    }),
  });
  assert("Citizen register", register.status === 200 && register.body?.userId);

  // Admin (login before review so session cookie is sent)
  const adminLogin = await req("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@sovereignnamibia.com", password: "admin12345" }),
  });
  assert("Admin login — DB credentials", adminLogin.body?.success === true, adminLogin.body?.role);
  assert("Admin session cookie set", cookieHeader.includes("sn_admin_session"));

  const adminBad = await req("/api/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@sovereignnamibia.com", password: "wrongpassword" }),
  });
  assert("Admin login — rejects bad password", adminBad.status === 401);

  const adminReview = await req("/api/admin/kyc/review", {
    method: "POST",
    body: JSON.stringify({ kycId, decision: "Approved", notes: "QA approval" }),
  });
  assert("Admin KYC review", adminReview.body?.success === true);

  const kycApproved = await req(`/api/kyc/${kycId}`);
  assert("KYC approved status", kycApproved.body?.status === "Approved", kycApproved.body?.status);

  // Privacy: homepage should not leak PII in HTML
  const homeHtml = await req("/", { method: "GET", headers: {} });
  const html = String(homeHtml.body ?? "");
  assert("Homepage — no raw PII", !html.includes("811234441") && !html.includes("85031500123"));

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n--- Summary: ${passed}/${results.length} passed ---`);
  if (failed.length) {
    console.log("\nFailures:");
    failed.forEach((f) => console.log(`  • ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log("\nAll QA checks passed.\n");
}

main().catch((err) => {
  console.error("QA runner error:", err.message);
  process.exit(1);
});
