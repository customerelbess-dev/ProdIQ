import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pb-24 pt-[88px] text-white sm:pt-[96px]">
      <article className="mx-auto max-w-[720px] px-4 sm:px-6">
        <h1 className="text-3xl font-bold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#888888]">Last updated: April 4, 2026</p>
        <div className="mt-10 max-w-none space-y-6 text-[15px] leading-relaxed text-[#aaaaaa]">
          <p>
            ProdIQ (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy describes how we handle information when you use
            our website and services.
          </p>
          <h2 className="text-lg font-semibold text-white">Information we collect</h2>
          <p>
            Account details you provide (such as email), product images and text you upload for analysis, usage data
            needed to operate the service, and technical logs (IP, device, browser) for security and reliability.
          </p>
          <h2 className="text-lg font-semibold text-white">How we use information</h2>
          <p>
            To generate reports, improve product quality, prevent abuse, communicate about your account, and comply with
            law. We do not sell your personal information.
          </p>
          <h2 className="text-lg font-semibold text-white">Retention</h2>
          <p>
            We retain data as long as your account is active or as needed for legal obligations. You may request deletion
            of your account by contacting support.
          </p>
          <h2 className="text-lg font-semibold text-white">Contact</h2>
          <p>
            Questions:{" "}
            <a href="mailto:support@prodiq.app" className="text-[#a78bfa] hover:underline">
              support@prodiq.app
            </a>
            .
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
