import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <article className="mx-auto max-w-[720px] px-4 sm:px-6">
        <h1 className="text-3xl font-bold">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#888888]">Last updated: April 4, 2026</p>
        <div className="mt-10 max-w-none space-y-6 text-[15px] leading-relaxed text-[#aaaaaa]">
          <p>
            By accessing ProdIQ you agree to these terms. If you disagree, do not use the service.
          </p>
          <h2 className="text-lg font-semibold text-white">Use of the service</h2>
          <p>
            You must provide accurate account information. You may not misuse the service, scrape it at scale without
            permission, or attempt to reverse engineer proprietary models.
          </p>
          <h2 className="text-lg font-semibold text-white">Reports and decisions</h2>
          <p>
            Outputs are informational and not financial or legal advice. You remain responsible for your business
            decisions, compliance, and advertising claims.
          </p>
          <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
          <p>
            Paid plans renew according to the billing option you select. Taxes may apply. We may change pricing with
            reasonable notice where required.
          </p>
          <h2 className="text-lg font-semibold text-white">Limitation of liability</h2>
          <p>
            To the fullest extent permitted by law, ProdIQ is not liable for indirect or consequential damages arising
            from use of the service.
          </p>
          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p>
            <a href="mailto:support@prodiq.app" className="text-[#a78bfa] hover:underline">
              support@prodiq.app
            </a>
          </p>
        </div>
        <p className="mt-12 text-sm text-[#666666]">
          <Link href="/" className="text-[#a78bfa] hover:underline">
            ← Home
          </Link>
        </p>
      </article>
    </main>
  );
}
