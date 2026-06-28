import type { AnchorHTMLAttributes } from "react";
import { cn } from "../lib/utils";

export type PoweredByProduct =
  | "standard-polls"
  | "standard-proof"
  | "standard-metrics"
  | "standard-hook"
  | "standard-release"
  | "standard-links";

export interface PoweredByBadgeProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  product?: PoweredByProduct;
  compact?: boolean;
}

const PRODUCT_URLS: Record<PoweredByProduct, string> = {
  "standard-polls": "https://polls.marketstandard.io",
  "standard-proof": "https://proof.marketstandard.io",
  "standard-metrics": "https://metrics.marketstandard.io",
  "standard-hook": "https://hook.marketstandard.io",
  "standard-release": "https://release.marketstandard.io",
  "standard-links": "https://links.marketstandard.io",
};

export function PoweredByBadge({
  product = "standard-polls",
  compact = false,
  className,
  ...props
}: PoweredByBadgeProps) {
  const href = PRODUCT_URLS[product] ?? "https://marketstandard.io";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1.5 text-[var(--text-mist)] transition-colors hover:text-[var(--color-flood)]",
        compact ? "text-xs" : "text-sm",
        className,
      )}
      {...props}
    >
      <span className="font-medium">Powered by</span>
      <span className="font-semibold text-[var(--color-flood)]">Market Standard</span>
    </a>
  );
}
