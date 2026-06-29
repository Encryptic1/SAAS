import { Badge, getPortfolioUrls } from "@market-standard/ui";

export type TargetHealth = {
  target: string;
  label: string;
  url: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs: number | null;
  detail?: string | null;
  href?: string;
};

const APP_TARGETS: Array<{ target: string; key: "polls" | "proof" | "metrics" | "hook" | "release" | "vault" | "links" | "snippets" | "status" | "regex" | "postmortem" | "lens" | "cron" }> = [
  { target: "standard-polls", key: "polls" },
  { target: "standard-proof", key: "proof" },
  { target: "standard-metrics", key: "metrics" },
  { target: "standard-hook", key: "hook" },
  { target: "standard-release", key: "release" },
  { target: "standard-vault", key: "vault" },
  { target: "standard-links", key: "links" },
  { target: "standard-snippets", key: "snippets" },
  { target: "standard-status", key: "status" },
  { target: "standard-regex", key: "regex" },
  { target: "standard-postmortem", key: "postmortem" },
  { target: "standard-lens", key: "lens" },
  { target: "standard-cron", key: "cron" },
];

const APP_LABELS: Record<string, string> = {
  polls: "Polls",
  proof: "Proof",
  metrics: "Metrics",
  hook: "Hook",
  release: "Release",
  vault: "Vault",
  links: "Links",
  snippets: "Snippets",
  status: "Status",
  regex: "Regex",
  postmortem: "Postmortem",
  lens: "Lens",
  cron: "Cron",
};

const EXTERNAL_TARGETS: Array<{ target: string; label: string; url: string }> = [
  { target: "floodg8", label: "FloodG8", url: "https://api.floodg8.dev" },
  { target: "syncdevtime", label: "SyncDevTime", url: "https://api.syncdevtime.dev" },
  { target: "supabase", label: "Supabase", url: "https://opodtvblrelmpoaprmpr.supabase.co" },
  { target: "stripe", label: "Stripe", url: "https://api.stripe.com" },
];

export function buildTargetList(): Array<{ target: string; label: string; url: string; href?: string }> {
  const urls = getPortfolioUrls();
  const apps = APP_TARGETS.map((a) => ({
    target: a.target,
    label: APP_LABELS[a.key]!,
    url: `${urls[a.key]}/api/health`,
    href: urls[a.key],
  }));
  return [...apps, ...EXTERNAL_TARGETS];
}

export function HealthGrid({ checks }: { checks: Array<{ target: string; status: string; latencyMs: number | null; detail?: string | null }> }) {
  const targets = buildTargetList();
  const latestByTarget = new Map<string, { status: string; latencyMs: number | null; detail?: string | null }>();
  for (const c of checks) {
    if (!latestByTarget.has(c.target)) latestByTarget.set(c.target, c);
  }

  const cells: TargetHealth[] = targets.map((t) => {
    const latest = latestByTarget.get(t.target);
    return {
      target: t.target,
      label: t.label,
      url: t.url,
      href: t.href,
      status: (latest?.status as TargetHealth["status"]) ?? "unknown",
      latencyMs: latest?.latencyMs ?? null,
      detail: latest?.detail ?? null,
    };
  });

  const ok = cells.filter((c) => c.status === "ok").length;
  const total = cells.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={ok === total ? "success" : ok >= total - 2 ? "warning" : "danger"} dot>
          {ok}/{total} healthy
        </Badge>
        <span className="ms-app-muted text-xs">Live status across the suite + externals</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cells.map((c) => (
          <a
            key={c.target}
            href={c.href ?? "#"}
            className={`ms-card p-3 flex flex-col gap-1 ${c.href ? "hover:border-[var(--accent-foam)]" : "cursor-default"}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{c.label}</span>
              <StatusDot status={c.status} />
            </div>
            <span className="text-xs opacity-60 font-mono truncate">{c.target}</span>
            <span className="text-xs opacity-50">
              {c.status === "unknown" ? "not checked" : `${c.status}${c.latencyMs != null ? ` · ${c.latencyMs}ms` : ""}`}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: TargetHealth["status"] }) {
  const color =
    status === "ok" ? "#39ff14" : status === "degraded" ? "#fbbf24" : status === "down" ? "#ff4d6d" : "#5a6378";
  return <span style={{ width: 8, height: 8, borderRadius: 999, background: color, display: "inline-block" }} />;
}
