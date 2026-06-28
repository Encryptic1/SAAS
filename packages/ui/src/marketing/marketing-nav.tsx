"use client";

import { useEffect, useState } from "react";
import type { MarketingCta, MarketingProduct } from "./marketing-landing";
import { getSiblingLinks } from "./portfolio-urls";

interface MarketingNavProps {
  product: MarketingProduct;
  productLabel: string;
  primaryCta: MarketingCta;
}

export function MarketingNav({ product, productLabel, primaryCta }: MarketingNavProps) {
  const siblings = getSiblingLinks(product);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const mobileLinks = [
    { label: "Mission", href: "#mission" },
    { label: "Features", href: "#capabilities" },
    ...siblings,
    { label: primaryCta.label, href: primaryCta.href },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.08] bg-[var(--bg-abyss)]/90 backdrop-blur-xl">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:h-16 sm:gap-3 sm:px-8 md:px-10">
        <a href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" onClick={() => setMenuOpen(false)}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[var(--color-flood)]/40 bg-[var(--color-flood)]/10 font-mono text-xs font-bold text-[var(--color-flood)]">
            MS
          </span>
          <span className="truncate text-sm font-semibold tracking-tight sm:text-base">{productLabel}</span>
        </a>

        <nav className="hidden items-center gap-6 text-xs uppercase tracking-[0.18em] text-[var(--text-mist)] md:flex">
          <a href="#mission" className="hover:text-[var(--color-flood)]">
            Mission
          </a>
          <a href="#capabilities" className="hover:text-[var(--color-flood)]">
            Features
          </a>
          {siblings.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-[var(--color-gilt-light)]">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <a
            href={primaryCta.href}
            className="ms-btn ms-btn-primary hidden text-xs sm:inline-flex sm:text-sm"
          >
            {primaryCta.label}
          </a>

          <button
            type="button"
            className="ms-btn ms-btn-ghost inline-flex !w-auto !min-w-[44px] px-2.5 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="ms-mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              {menuOpen ? (
                <>
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="7" x2="21" y2="7" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="17" x2="21" y2="17" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav id="ms-mobile-nav" className="ms-mobile-nav px-4 py-4 md:hidden">
          <div className="grid grid-cols-1 gap-2">
            {mobileLinks.map((link) => (
              <a
                key={link.href + link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
