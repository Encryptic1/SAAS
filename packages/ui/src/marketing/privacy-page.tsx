import { LocalDevBanner } from "../components/local-dev-banner";

interface PrivacyPageProps {
  productName: string;
}

export function PrivacyPage({ productName }: PrivacyPageProps) {
  return (
    <div className="ms-marketing ms-noise min-h-screen min-h-[100dvh]">
      <LocalDevBanner />
      <main className="mx-auto max-w-2xl px-5 py-16 sm:px-8">
        <a href="/" className="ms-app-link text-sm no-underline hover:underline">
          ← Back to {productName}
        </a>
        <h1 className="ms-section-heading mt-6">Privacy Policy</h1>
        <p className="ms-lede mt-4">
          <strong className="text-[var(--text-foam)]">Market Standard, LLC</strong> operates {productName}. This is a
          placeholder policy for local review and marketplace submission prep.
        </p>
        <div className="mt-8 space-y-6 text-[var(--text-mist)]">
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-foam)]">Data we collect</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Account identifiers, usage events, and product-specific data needed to deliver the service (e.g. Slack
              workspace metadata, testimonial content, or Stripe account metrics).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-foam)]">How we use data</h2>
            <p className="mt-2 text-sm leading-relaxed">
              To operate the product, improve reliability, enforce plan limits, and provide support. We do not sell
              personal data.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-foam)]">Contact</h2>
            <p className="mt-2 text-sm leading-relaxed">
              Questions:{" "}
              <a href="mailto:privacy@marketstandard.app" className="ms-app-link">
                privacy@marketstandard.app
              </a>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
