import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "../lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Rendered at the top above the title — small uppercase label. */
  eyebrow?: string;
  /** Breadcrumb trail. */
  breadcrumbs?: BreadcrumbItem[];
  /** Right-aligned actions (buttons, badges). */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, eyebrow, breadcrumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("ms-dash-page-header", className)}>
      <div className="ms-dash-page-header-main">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="ms-dash-breadcrumbs" aria-label="Breadcrumb">
            <ol>
              {breadcrumbs.map((b, i) => (
                <li key={i}>
                  {b.href ? (
                    <Link href={b.href} className="ms-dash-breadcrumb-link">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="ms-dash-breadcrumb-current" aria-current="page">
                      {b.label}
                    </span>
                  )}
                  {i < breadcrumbs.length - 1 && <span className="ms-dash-breadcrumb-sep" aria-hidden>›</span>}
                </li>
              ))}
            </ol>
          </nav>
        )}
        {eyebrow && <p className="ms-dash-page-header-eyebrow">{eyebrow}</p>}
        <h1 className="ms-dash-page-header-title">{title}</h1>
        {subtitle && <p className="ms-dash-page-header-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ms-dash-page-header-actions">{actions}</div>}
    </header>
  );
}
