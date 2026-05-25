const FAQ = [
  {
    q: "How do I find my citizen account?",
    a: "Visit sovereignnamibia.com and select Find My Citizen Account. Enter your legal name, mobile number, and date of birth.",
  },
  {
    q: "What documents are accepted for verification?",
    a: "Namibian National ID, Driver's License, Passport, residence proof, and telecom account verification.",
  },
  {
    q: "Is my data protected?",
    a: "Yes. Your information is protected. All documents are encrypted during upload and at rest.",
  },
  {
    q: "How long does verification take?",
    a: "Automated checks are immediate. Admin review typically completes within 2–5 business days.",
  },
];

export default function SupportSubdomainPage() {
  return (
    <div className="min-h-screen bg-[var(--sn-warm-white)]">
      <header className="border-b border-[rgba(12,45,74,0.08)] px-6 py-8">
        <p className="sn-eyebrow">support.sovereignnamibia.com</p>
        <h1 className="mt-2 text-3xl font-semibold text-[var(--sn-blue)]">Support Center</h1>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-12">
        <section className="sn-card mb-8 p-8">
          <h2 className="font-semibold text-[var(--sn-blue)]">Contact Support</h2>
          <p className="mt-3 sn-prose text-sm">
            Email: support@sovereignnamibia.com · Hours: Mon–Fri 08:00–17:00 WAT
          </p>
        </section>

        <h2 className="sn-eyebrow mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {FAQ.map((item) => (
            <details key={item.q} className="sn-card p-6">
              <summary className="cursor-pointer font-medium text-[var(--sn-blue)]">
                {item.q}
              </summary>
              <p className="mt-4 sn-prose text-sm">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
