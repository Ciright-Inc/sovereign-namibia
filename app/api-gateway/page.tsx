import Link from "next/link";

export default function ApiGatewayPage() {
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)] px-6 py-12">
      <p className="sn-eyebrow">api.sovereignnamibia.com</p>
      <h1 className="mt-2 text-3xl font-semibold text-[var(--sn-blue)]">API Gateway</h1>
      <p className="mt-4 max-w-xl sn-prose">
        Sovereign Namibia developer API. See{" "}
        <Link href="/api" className="underline">
          /api
        </Link>{" "}
        for the service index JSON.
      </p>
    </div>
  );
}
