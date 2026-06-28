import type { MarketingProduct } from "./marketing-landing";
import { getPortfolioUrls } from "./portfolio-urls";

const PRODUCTS: { id: MarketingProduct; label: string; key: keyof ReturnType<typeof getPortfolioUrls> }[] = [
  { id: "standard-polls", label: "Standard Polls", key: "polls" },
  { id: "standard-proof", label: "Standard Proof", key: "proof" },
  { id: "standard-metrics", label: "Standard Metrics", key: "metrics" },
  { id: "standard-hook", label: "Standard Hook", key: "hook" },
  { id: "standard-release", label: "Standard Release", key: "release" },
  { id: "standard-vault", label: "Standard Vault", key: "vault" },
  { id: "standard-links", label: "Standard Links", key: "links" },
  { id: "standard-lens", label: "Standard Lens", key: "lens" },
  { id: "standard-cron", label: "Standard Cron", key: "cron" },
  { id: "standard-snippets", label: "Standard Snippets", key: "snippets" },
  { id: "standard-status", label: "Standard Status", key: "status" },
  { id: "standard-regex", label: "Standard Regex", key: "regex" },
  { id: "standard-postmortem", label: "Standard Postmortem", key: "postmortem" },
];

interface MarketingFooterProps {
  product: MarketingProduct;
}

export function MarketingFooter({ product }: MarketingFooterProps) {
  const urls = getPortfolioUrls();

  return (
    <footer className="border-t border-white/[0.08] bg-black/20 px-5 py-12 sm:px-8 md:px-12">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-gilt)]/40 font-mono text-xs font-bold text-[var(--color-gilt-light)]">
              MS
            </span>
            <span className="font-semibold">Market Standard, LLC</span>
          </div>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-fog)]">
            Portfolio of focused SaaS products — polls, social proof, and subscription metrics — built for organic
            growth and zero paid acquisition.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 font-mono text-xs uppercase tracking-[0.18em] text-[var(--text-fog)]">
          {PRODUCTS.map((p) => (
            <a
              key={p.id}
              href={urls[p.key]}
              className={p.id === product ? "text-[var(--color-flood)]" : "hover:text-[var(--text-mist)]"}
            >
              {p.label}
            </a>
          ))}
          <a href="/privacy" className="hover:text-[var(--text-mist)]">
            Privacy
          </a>
          <a href="https://www.marketstandard.app/" className="hover:text-[var(--text-mist)]">
            Portfolio
          </a>
        </div>
      </div>
    </footer>
  );
}
