"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LocalDevBanner } from "../components/local-dev-banner";
import { SuiteSwitcher } from "../marketing/suite-switcher";
import { getSuiteApps } from "../marketing/suite-switcher";
import { cn } from "../lib/utils";
import { CommandPalette, type CommandItem } from "./command-palette";
import { ToastProvider } from "./toast";

export type DashboardNav = "overview" | "content" | "analytics" | "billing" | "settings";

export type DashboardProduct =
  | "standard-polls"
  | "standard-proof"
  | "standard-metrics"
  | "standard-hook"
  | "standard-release"
  | "standard-links"
  | "standard-vault"
  | "standard-snippets"
  | "standard-status"
  | "standard-regex"
  | "standard-postmortem"
  | "standard-lens"
  | "standard-cron"
  | "standard-workspace";

export interface DashboardNavItem {
  href: string;
  label: string;
  exact?: boolean;
  /** Optional badge count rendered on the right. */
  badge?: ReactNode;
}

export interface DashboardShellProps {
  product?: DashboardProduct;
  productName: string;
  children: ReactNode;
  /** Custom sidebar nav; when set, overrides the default five-item layout. */
  nav?: DashboardNavItem[];
  /** Override the Collections/Content nav href (default `/dashboard/content`). */
  contentHref?: string;
  /** Optional cross-sell links rendered in a separate sidebar section. */
  crossSell?: Array<{ label: string; href: string; blurb?: string }>;
  /** Right-aligned slot in the top bar (account menu, plan badge, etc). */
  topBarActions?: ReactNode;
  className?: string;
}

const DEFAULT_NAV: { id: DashboardNav; label: string; href: string }[] = [
  { id: "overview", label: "Overview", href: "/dashboard" },
  { id: "content", label: "Content", href: "/dashboard/content" },
  { id: "analytics", label: "Analytics", href: "/dashboard/analytics" },
  { id: "billing", label: "Billing", href: "/dashboard/billing" },
  { id: "settings", label: "Settings", href: "/dashboard/settings" },
];

function contentNavLabel(product: DashboardProduct): string {
  return product === "standard-proof" ? "Collections" : "Content";
}

function resolveActive(pathname: string, contentHref: string): DashboardNav {
  if (pathname === "/dashboard") return "overview";
  if (pathname.startsWith(contentHref)) return "content";
  if (pathname.startsWith("/dashboard/analytics")) return "analytics";
  if (pathname.startsWith("/dashboard/billing")) return "billing";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  return "overview";
}

function productKey(product: DashboardProduct): string {
  return product.replace("standard-", "");
}

export function DashboardShell({
  product = "standard-proof",
  productName,
  children,
  nav,
  contentHref = "/dashboard/content",
  crossSell,
  topBarActions,
  className,
}: DashboardShellProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname, contentHref);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const paletteCommands = useMemo<CommandItem[]>(() => {
    const navItems =
      nav ??
      DEFAULT_NAV.map((item) => ({
        href: item.id === "content" ? contentHref : item.href,
        label: item.id === "content" ? contentNavLabel(product) : item.label,
      }));
    const navCommands: CommandItem[] = navItems.map((item, i) => ({
      id: `nav-${i}`,
      label: item.label,
      group: "This app",
      hint: "Open",
      href: item.href,
    }));
    const suiteCommands: CommandItem[] = getSuiteApps()
      .filter((a) => a.key !== productKey(product))
      .map((a) => ({
        id: `suite-${a.key}`,
        label: a.label,
        group: "Switch app",
        keywords: `${a.blurb} ${a.key}`,
        hint: a.external ? "↗" : "Open",
        onSelect: () => {
          window.location.href = a.href;
        },
      }));
    return [...navCommands, ...suiteCommands];
  }, [nav, contentHref, product]);

  return (
    <ToastProvider>
      <div className={cn("ms-marketing ms-app ms-noise ms-dash", collapsed && "ms-dash-collapsed", className)}>
        <LocalDevBanner />

        {/* Mobile top bar (visible < 768px) */}
        <div className="ms-dash-mobile-topbar">
          <button
            type="button"
            className="ms-dash-mobile-menu-btn"
            aria-label="Toggle navigation"
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((p) => !p)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              {sidebarOpen ? (
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              ) : (
                <path d="M3 5h12M3 9h12M3 13h12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
              )}
            </svg>
          </button>
          <SuiteSwitcher current={product} compact />
          <div className="ms-dash-mobile-topbar-actions">{topBarActions}</div>
        </div>

        {/* Sidebar — slides in on mobile when sidebarOpen */}
        <aside className={cn("ms-dash-sidebar", sidebarOpen && "ms-dash-sidebar-open")}>
          <div className="ms-dash-sidebar-brand">
            <span className="ms-dash-sidebar-eyebrow">Market Standard</span>
            <Link href="/dashboard" className="ms-dash-sidebar-title no-underline">
              {productName}
            </Link>
          </div>
          <nav className="ms-dash-nav" aria-label="Dashboard">
            {nav
              ? nav.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn("ms-dash-nav-item", isActive && "ms-dash-nav-item-active")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{item.label}</span>
                      {item.badge != null && <span className="ms-dash-nav-item-badge">{item.badge}</span>}
                    </Link>
                  );
                })
              : DEFAULT_NAV.map((item) => {
                  const label = item.id === "content" ? contentNavLabel(product) : item.label;
                  const href = item.id === "content" ? contentHref : item.href;
                  const isActive = active === item.id;
                  return (
                    <Link
                      key={item.id}
                      href={href}
                      className={cn("ms-dash-nav-item", isActive && "ms-dash-nav-item-active")}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {label}
                    </Link>
                  );
                })}
          </nav>

          {crossSell && crossSell.length > 0 && (
            <div className="ms-dash-sidebar-crosssell">
              <p className="ms-dash-sidebar-crosssell-label">Cross-sell</p>
              {crossSell.map((c) => (
                <a key={c.href} href={c.href} className="ms-dash-nav-item ms-dash-nav-item-crosssell" title={c.blurb}>
                  <span>{c.label}</span>
                  <span className="ms-dash-nav-item-crosssell-arrow" aria-hidden>↗</span>
                </a>
              ))}
            </div>
          )}

          <div className="ms-dash-sidebar-foot">
            <button
              type="button"
              className="ms-dash-collapse-btn"
              onClick={() => setCollapsed((p) => !p)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d={collapsed ? "M5 3l4 4-4 4" : "M9 3L5 7l4 4"} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="ms-dash-collapse-label">{collapsed ? "Expand" : "Collapse"}</span>
            </button>
            <Link href="/" className="ms-dash-nav-item text-xs">
              ← Marketing site
            </Link>
            {product && <span className="ms-dash-sidebar-product mt-2 block">{product}</span>}
          </div>
        </aside>

        {/* Mobile backdrop */}
        {sidebarOpen && <div className="ms-dash-mobile-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden />}

        <div className="ms-dash-body">
          {/* Desktop top bar (hidden < 768px) */}
          <div className="ms-dash-topbar">
            <SuiteSwitcher current={product} />
            <div className="ms-dash-topbar-right">
              <CommandPalette commands={paletteCommands} />
              {topBarActions}
            </div>
          </div>
          <main className="ms-dash-main">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
