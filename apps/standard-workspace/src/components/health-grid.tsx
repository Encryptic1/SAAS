import { Badge } from "@market-standard/ui";

export type TargetHealth = {
  target: string;
  label: string;
  url: string;
  status: "ok" | "degraded" | "down" | "unknown";
  latencyMs: number | null;
  detail?: string | null;
  href?: string;
};

const APP_TARGETS: Array<{ target: string; label: string; port: number; href: string }> = [
  { target: "standard-polls", label: "Polls", port: 3001, href: "http://localhost:3001" },
  { target: "standard-proof", label: "Proof", port: 3002, href: "http://localhost:3002" },
  { target: "standard-metrics", label: "Metrics", port: 3003, href: "http://localhost:3003" },
  { target: "standard-hook", label: "Hook", port: 3004, href: "http://localhost:3004" },
  { target: "standard-release", label: "Release", port: 3005, href: "http://localhost:3005" },
  { target: "standard-vault", label: "Vault", port: 3006, href: "http://localhost:3006" },
  { target: "standard-links", label: "Links", port: 3007, href: "http://localhost:3007" },
  { target: "standard-snippets", label: "Snippets", port: 3008, href: "http://localhost:3008" },
  { target: "standard-status", label: "Status", port: 3009, href: "http://localhost:3009" },
  { target: "standard-regex", label: "Regex", port: 3010, href: "http://localhost:3010" },
  { target: "standard-postmortem", label: "Postmortem", port: 3011, href: "http://localhost:3011" },
  { target: "standard-lens", label: "Lens", port: 3012, href: "http://localhost:3012" },
  { target: "standard-cron", label: "Cron", port: 3013, href: "http://localhost:3013" },
];

const EXTERNAL_TARGETS: Array<{ target: string; label: string; url: string }> = [
  { target: "floodg8", label: "FloodG8", url: "https://api.floodg8.dev" },
  { target: "syncdevtime", label: "SyncDevTime", url: "https://api.syncdevtime.dev" },
  { target: "supabase", label: "Supabase", url: "https://opodtvblrelmpoaprmpr.supabase.co" },
  { target: "stripe", label: "Stripe", url: "https://api.stripe.com" },
];

export function buildTargetList(): Array<{ target: string; label: string; url: string; href?: string }> {
  const localBase = process.env.NEXT_PUBLIC_LOCAL_DEV === "true" ? "http://localhost" : "https://standard-{x}.vercel.app";
  const apps = APP_TARGETS.map((a) => ({
    target: a.target,
    label: a.label,
    url: localBase === "http://localhost" ? `${localBase}:${a.port}/api/health` : `https://standard-${a.target.replace("standard-", "")}.vercel.app/api/health`,
    href: a.href,
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
