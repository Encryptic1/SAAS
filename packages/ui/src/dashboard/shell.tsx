"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LocalDevBanner } from "../components/local-dev-banner";
import { cn } from "../lib/utils";

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
  | "standard-postmortem";

export interface DashboardNavItem {
  href: string;
  label: string;
  exact?: boolean;
}

export interface DashboardShellProps {
  product?: DashboardProduct;
  productName: string;
  children: ReactNode;
  /** Custom sidebar nav; when set, overrides the default five-item layout. */
  nav?: DashboardNavItem[];
  /** Override the Collections/Content nav href (default `/dashboard/content`). */
  contentHref?: string;
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

export function DashboardShell({
  product = "standard-proof",
  productName,
  children,
  nav,
  contentHref = "/dashboard/content",
  className,
}: DashboardShellProps) {
  const pathname = usePathname();
  const active = resolveActive(pathname, contentHref);

  return (
    <div className={cn("ms-marketing ms-app ms-noise ms-dash", className)}>
      <LocalDevBanner />
      <aside className="ms-dash-sidebar">
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
                    {item.label}
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
        <div className="ms-dash-sidebar-foot">
          <Link href="/" className="ms-dash-nav-item text-xs">
            ← Marketing site
          </Link>
          {product && <span className="ms-dash-sidebar-product mt-2 block">{product}</span>}
        </div>
      </aside>
      <div className="ms-dash-body">
        <main className="ms-dash-main">{children}</main>
      </div>
    </div>
  );
}
