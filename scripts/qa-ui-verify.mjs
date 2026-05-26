#!/usr/bin/env node
/**
 * UI verification for footer, legal pages, and status dashboard.
 * Run: node scripts/qa-ui-verify.mjs
 */
const BASE = process.env.QA_BASE ?? "http://localhost:3010";

const results = [];

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

async function fetchHtml(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, html: await res.text() };
}

async function fetchJson(path) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json() };
}

async function main() {
  console.log(`\nSovereign Namibia UI QA — ${BASE}\n`);

  const home = await fetchHtml("/");
  assert("Homepage loads", home.status === 200);
  assert("Footer — sovereign brand", home.html.includes("Sovereign Namibia"));
  assert(
    "Footer — legal section",
    home.html.includes("Legal &amp; Governance") || home.html.includes("Legal & Governance")
  );
  assert("Footer — privacy link href", home.html.includes('href="/legal/privacy"'));
  assert("Footer — terms link href", home.html.includes('href="/legal/terms"'));
  assert("Footer — rights link href", home.html.includes('href="/legal/rights"'));
  assert("Footer — status link", home.html.includes("/status"));
  assert("Footer — dark styling", home.html.includes("sn-site-footer"));

  const privacy = await fetchHtml("/legal/privacy");
  assert("Privacy page loads", privacy.status === 200);
  assert("Privacy — constitutional foundation", privacy.html.includes("Constitutional Foundation"));
  assert("Privacy — data ownership", privacy.html.includes("Citizen Data Ownership"));
  assert(
    "Privacy — no data sale",
    privacy.html.includes("do not sell") || privacy.html.includes("does not sell")
  );
  assert("Privacy — infrastructure section", privacy.html.includes("Cross-Border Transfers"));
  assert("Privacy — accordion sections", privacy.html.includes("sn-legal-section"));

  const terms = await fetchHtml("/legal/terms");
  assert("Terms page loads", terms.status === 200);
  assert("Terms — sovereign principles", terms.html.includes("Sovereign Data Principles"));
  assert("Terms — scraping prohibited", terms.html.includes("Unauthorized scraping"));
  assert("Terms — enforcement", terms.html.includes("Cybersecurity Enforcement"));

  const rights = await fetchHtml("/legal/rights");
  assert("Rights page loads", rights.status === 200);
  assert("Rights — citizen title", rights.html.includes("Your Rights as a Namibian Citizen"));
  assert("Rights — constitution viewer", rights.html.includes("Constitution of the Republic of Namibia"));
  assert("Rights — search interface", rights.html.includes("Search articles"));
  assert("Rights — Article 13", rights.html.includes("Article 13"));

  const status = await fetchHtml("/status");
  assert("Status page loads", status.status === 200);
  assert("Status — hero title", status.html.includes("Sovereign Infrastructure Status"));
  assert("Status — uptime metric", status.html.includes("Uptime Since April 2025"));
  assert("Status — service health", status.html.includes("Service Health"));
  assert("Status — regional infra", status.html.includes("Regional Infrastructure"));
  assert("Status — incidents", status.html.includes("Incident History"));
  assert("Status — dashboard styling", status.html.includes("sn-status-dashboard"));

  const statusApi = await fetchJson("/api/status");
  assert("Status API — 200", statusApi.status === 200);
  assert("Status API — overall", !!statusApi.body?.overall);
  assert("Status API — uptime", statusApi.body?.uptimeDisplay === "99.9999%");
  assert("Status API — services", (statusApi.body?.services?.length ?? 0) >= 7);
  assert("Status API — regions", (statusApi.body?.regions?.length ?? 0) >= 3);
  assert(
    "Status API — SA region",
    statusApi.body?.regions?.some((r) => r.name.includes("South Africa"))
  );
  assert(
    "Status API — live latency",
    typeof statusApi.body?.metrics?.apiLatencyMs === "number"
  );

  const statusSub = await fetchHtml("/?subdomain=status");
  assert("Status subdomain rewrite", statusSub.status === 200);
  assert("Status subdomain — dashboard", statusSub.html.includes("Sovereign Infrastructure Status"));

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`\n--- UI Summary: ${passed}/${results.length} passed ---`);
  if (failed.length) {
    console.log("\nFailures:");
    failed.forEach((f) => console.log(`  • ${f.name}: ${f.detail}`));
    process.exit(1);
  }
  console.log("\nAll UI checks passed.\n");
}

main().catch((err) => {
  console.error("UI QA runner error:", err.message);
  process.exit(1);
});
