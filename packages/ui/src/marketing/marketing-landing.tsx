import type { ReactNode } from "react";
import { HeroField } from "./hero-field";
import { MarketingFooter } from "./marketing-footer";
import { MarketingNav } from "./marketing-nav";
import { ProductHeroAside } from "./product-hero-aside";

export interface MarketingFeature {
  title: string;
  body: string;
}

export interface MarketingStat {
  value: string;
  label: string;
}

export interface MarketingPricingTier {
  tier: string;
  price: string;
  limits: string;
  highlight?: boolean;
}

export interface MarketingCta {
  label: string;
  href: string;
}

export type MarketingProduct =
  | "standard-polls"
  | "standard-proof"
  | "standard-metrics"
  | "standard-hook"
  | "standard-release"
  | "standard-links"
  | "standard-vault"
  | "standard-lens"
  | "standard-cron"
  | "standard-snippets"
  | "standard-status"
  | "standard-regex"
  | "standard-postmortem";

export interface MarketingLandingProps {
  product: MarketingProduct;
  productLabel: string;
  eyebrow: string;
  headline: ReactNode;
  lede: string;
  highlight?: ReactNode;
  primaryCta: MarketingCta;
  secondaryCta?: MarketingCta;
  tertiaryCta?: MarketingCta;
  stats: MarketingStat[];
  missionTitle: string;
  missionBody: string;
  featuresTitle: string;
  features: MarketingFeature[];
  stepsTitle: string;
  steps: string[];
  pricingTitle: string;
  pricing: MarketingPricingTier[];
  proofTitle: string;
  proofPoints: string[];
  dbHint?: string;
}

export function MarketingLanding({
  product,
  productLabel,
  eyebrow,
  headline,
  lede,
  highlight,
  primaryCta,
  secondaryCta,
  tertiaryCta,
  stats,
  missionTitle,
  missionBody,
  featuresTitle,
  features,
  stepsTitle,
  steps,
  pricingTitle,
  pricing,
  proofTitle,
  proofPoints,
  dbHint,
}: MarketingLandingProps) {
  return (
    <div className="ms-marketing">
      <MarketingNav product={product} productLabel={productLabel} primaryCta={primaryCta} />
      <section className="relative flex flex-col justify-center overflow-hidden px-4 py-12 sm:px-8 sm:py-16 md:px-12 md:py-20 lg:min-h-[calc(100vh-4rem)]">
        <HeroField />
        <div className="relative z-10 grid w-full grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_480px] lg:items-center lg:gap-20">
          <div className="max-w-5xl">
            <div className="ms-eyebrow ms-animate-fade-up mb-6">{eyebrow}</div>
            <h1 className="ms-hero-heading ms-animate-fade-up ms-animate-delay-1">{headline}</h1>
            <p className="ms-animate-fade-up ms-animate-delay-2 mt-7 max-w-3xl text-base leading-8 text-[var(--ms-mist)] sm:text-lg md:text-xl">
              {lede}
            </p>
            {highlight && (
              <p className="ms-animate-fade-up ms-animate-delay-2 mt-5 max-w-3xl text-sm leading-7 text-[var(--ms-gilt-light)] sm:text-base">
                {highlight}
              </p>
            )}
            <div className="ms-animate-fade-up ms-animate-delay-3 mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a href={primaryCta.href} className="ms-btn ms-btn-primary">
                {primaryCta.label}
              </a>
              {secondaryCta && (
                <a href={secondaryCta.href} className="ms-btn ms-btn-gilt">
                  {secondaryCta.label}
                </a>
              )}
              {tertiaryCta && (
                <a href={tertiaryCta.href} className="ms-btn ms-btn-ghost">
                  {tertiaryCta.label}
                </a>
              )}
            </div>
            {dbHint && (
              <p className="ms-animate-fade-up ms-animate-delay-4 mt-4 font-mono text-xs text-[var(--ms-fog)]">
                {dbHint}
              </p>
            )}
            <div className="mt-12 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="border-l border-[var(--ms-gilt)]/40 pl-4">
                  <div className="text-3xl font-black text-[var(--ms-gilt-light)]">{stat.value}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[var(--ms-fog)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="ms-animate-fade-up ms-animate-delay-3">
            <ProductHeroAside product={product} />
          </div>
        </div>
      </section>

      <div className="ms-divider" aria-hidden />

      <section id="mission" className="px-4 py-16 sm:px-8 sm:py-20 md:px-12 md:py-28">
        <div className="max-w-4xl">
          <div className="ms-eyebrow mb-5">Mission</div>
          <h2 className="ms-section-heading">{missionTitle}</h2>
          <p className="ms-lede">{missionBody}</p>
        </div>
      </section>

      <section id="capabilities" className="px-4 py-12 sm:px-8 sm:py-16 md:px-12 md:py-24">
        <div className="mb-12">
          <div className="ms-eyebrow mb-5">Capabilities</div>
          <h2 className="ms-section-heading">{featuresTitle}</h2>
        </div>
        <div className="grid grid-cols-1 gap-[1px] border border-white/[0.06] bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-3">
          {features.map((feature, index) => (
            <article key={feature.title} className="ms-card">
              <div className="font-mono text-[10px] text-[var(--ms-gilt-light)]">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-auto">
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--ms-mist)]">{feature.body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[0.8fr_1.2fr] xl:gap-16">
          <div>
            <div className="ms-eyebrow mb-5">How it works</div>
            <h2 className="ms-section-heading">{stepsTitle}</h2>
          </div>
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={step} className="ms-panel flex gap-4 p-4 md:p-5">
                <span className="font-mono text-[var(--ms-flood)]">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm text-[var(--ms-mist)] md:text-base">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="grid grid-cols-1 items-center gap-10 xl:grid-cols-[1.1fr_0.9fr] xl:gap-16">
          <div>
            <div className="ms-eyebrow mb-5">Pricing</div>
            <h2 className="ms-section-heading">{pricingTitle}</h2>
            <p className="ms-lede">Start free. Upgrade when you outgrow limits or want to remove the powered-by badge.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {pricing.map((tier) => (
              <div
                key={tier.tier}
                className={`ms-panel p-5 ${tier.highlight ? "border-[var(--ms-flood)]/50" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-4">
                  <div className="font-semibold">{tier.tier}</div>
                  <div className="font-mono text-sm text-[var(--ms-gilt-light)]">{tier.price}</div>
                </div>
                <p className="mt-2 text-sm text-[var(--ms-mist)]">{tier.limits}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 md:px-12 md:py-28">
        <div className="ms-panel relative overflow-hidden p-6 md:p-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(57,255,20,0.08),transparent_40%)]" />
          <div className="relative z-10 grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_420px]">
            <div>
              <div className="ms-eyebrow mb-5">Why Market Standard</div>
              <h2 className="ms-section-heading">{proofTitle}</h2>
              <p className="ms-lede">
                Three focused products, one portfolio. Each app is built to spread your brand while solving one job
                extremely well.
              </p>
              <a href={primaryCta.href} className="ms-btn ms-btn-primary mt-8 inline-flex">
                {primaryCta.label}
              </a>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {proofPoints.map((point) => (
                <div key={point} className="rounded-lg border border-white/[0.08] p-4 text-sm">
                  <span className="text-[var(--ms-flood)]">▸</span>{" "}
                  <span className="text-[var(--ms-mist)]">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <MarketingFooter product={product} />
    </div>
  );
}
