"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/utils";
import { getPortfolioUrls } from "./portfolio-urls";
import type { MarketingProduct } from "./marketing-landing";

export interface SuiteSwitcherProps {
  current: MarketingProduct;
  className?: string;
  /** Compact variant — just the app icon + chevron. */
  compact?: boolean;
}

interface SuiteApp {
  key: string;
  label: string;
  href: string;
  blurb: string;
  external?: boolean;
  category: "portfolio" | "ecosystem";
}

const APPS: Array<Omit<SuiteApp, "href">> = [
  { key: "polls", label: "Standard Polls", blurb: "Slack polls & standups", category: "portfolio" },
  { key: "proof", label: "Standard Proof", blurb: "Social proof wall", category: "portfolio" },
  { key: "metrics", label: "Standard Metrics", blurb: "Stripe MRR dashboard", category: "portfolio" },
  { key: "hook", label: "Standard Hook", blurb: "Webhook inbox + replay", category: "portfolio" },
  { key: "release", label: "Standard Release", blurb: "Changelog from merged PRs", category: "portfolio" },
  { key: "vault", label: "Standard Vault", blurb: "Encrypted secrets for agents", category: "portfolio" },
  { key: "links", label: "Standard Links", blurb: "Branded payment link tracker", category: "portfolio" },
  { key: "snippets", label: "Standard Snippets", blurb: "Versioned code snippets", category: "portfolio" },
  { key: "status", label: "Standard Status", blurb: "CI / deploy / incident pane", category: "portfolio" },
  { key: "regex", label: "Standard Regex", blurb: "Regex builder + explainer", category: "portfolio" },
  { key: "postmortem", label: "Standard Postmortem", blurb: "Blameless retros + recurrence", category: "portfolio" },
  { key: "lens", label: "Standard Lens", blurb: "DB query optimizer", category: "portfolio" },
  { key: "cron", label: "Standard Cron", blurb: "Cron monitor + alerting", category: "portfolio" },
  { key: "workspace", label: "Standard Workspace", blurb: "Multi-app ops console", category: "portfolio" },
  { key: "floodg8", label: "FloodG8", blurb: "Agent plan editor + reports", external: true, category: "ecosystem" },
  { key: "syncdevtime", label: "SyncDevTime", blurb: "Engineering time tracking", external: true, category: "ecosystem" },
];

const PRODUCT_TO_APP_KEY: Record<MarketingProduct, string> = {
  "standard-polls": "polls",
  "standard-proof": "proof",
  "standard-metrics": "metrics",
  "standard-hook": "hook",
  "standard-release": "release",
  "standard-links": "links",
  "standard-vault": "vault",
  "standard-snippets": "snippets",
  "standard-status": "status",
  "standard-regex": "regex",
  "standard-postmortem": "postmortem",
  "standard-lens": "lens",
  "standard-cron": "cron",
  "standard-workspace": "workspace",
};

export function getSuiteApps(): SuiteApp[] {
  const urls = getPortfolioUrls();
  return APPS.map((a) => ({
    ...a,
    href: (urls as Record<string, string>)[a.key] ?? "#",
  }));
}

export function SuiteSwitcher({ current, className, compact = false }: SuiteSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const currentKey = PRODUCT_TO_APP_KEY[current] ?? current.replace("standard-", "");
  const apps = getSuiteApps();
  const currentApp = apps.find((a) => a.key === currentKey) ?? apps[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const filtered = apps.filter((a) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return `${a.label} ${a.blurb} ${a.key}`.toLowerCase().includes(q);
  });

  const portfolio = filtered.filter((a) => a.category === "portfolio");
  const ecosystem = filtered.filter((a) => a.category === "ecosystem");

  return (
    <div ref={rootRef} className={cn("ms-suite-switcher", compact && "ms-suite-switcher-compact", className)}>
      <button
        type="button"
        className="ms-suite-switcher-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        <span className="ms-suite-switcher-glyph" aria-hidden>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" />
            <rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.5" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" />
          </svg>
        </span>
        <span className="ms-suite-switcher-label">
          {compact ? currentApp?.label.split(" ")[1] ?? "Suite" : currentApp?.label ?? "Market Standard Suite"}
        </span>
        <svg className={cn("ms-suite-switcher-chevron", open && "ms-suite-switcher-chevron-open")} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M3 4.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="ms-suite-switcher-panel" role="listbox">
          <div className="ms-suite-switcher-search">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              autoFocus
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Switch to…"
              className="ms-suite-switcher-input"
              aria-label="Filter apps"
            />
          </div>
          {portfolio.length > 0 && (
            <div className="ms-suite-switcher-group">
              <p className="ms-suite-switcher-group-label">Market Standard Suite</p>
              <ul>
                {portfolio.map((a) => (
                  <li key={a.key}>
                    <a
                      href={a.href}
                      className={cn("ms-suite-switcher-item", a.key === currentKey && "ms-suite-switcher-item-current")}
                      aria-current={a.key === currentKey ? "true" : undefined}
                    >
                      <span className="ms-suite-switcher-item-glyph" aria-hidden />
                      <span className="ms-suite-switcher-item-text">
                        <span className="ms-suite-switcher-item-label">{a.label}</span>
                        <span className="ms-suite-switcher-item-blurb">{a.blurb}</span>
                      </span>
                      {a.key === currentKey && <span className="ms-suite-switcher-item-current-mark" aria-hidden>●</span>}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ecosystem.length > 0 && (
            <div className="ms-suite-switcher-group">
              <p className="ms-suite-switcher-group-label">Ecosystem</p>
              <ul>
                {ecosystem.map((a) => (
                  <li key={a.key}>
                    <a
                      href={a.href}
                      target={a.external ? "_blank" : undefined}
                      rel={a.external ? "noreferrer" : undefined}
                      className="ms-suite-switcher-item"
                    >
                      <span className="ms-suite-switcher-item-glyph" aria-hidden />
                      <span className="ms-suite-switcher-item-text">
                        <span className="ms-suite-switcher-item-label">
                          {a.label}
                          {a.external && <span className="ms-suite-switcher-external" aria-hidden>↗</span>}
                        </span>
                        <span className="ms-suite-switcher-item-blurb">{a.blurb}</span>
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {filtered.length === 0 && (
            <p className="ms-suite-switcher-empty">No apps match &ldquo;{filter}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
