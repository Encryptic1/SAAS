import type { MarketingProduct } from "./marketing-landing";
import { getPortfolioUrls } from "./portfolio-urls";

interface ProductHeroAsideProps {
  product: MarketingProduct;
}

export function ProductHeroAside({ product }: ProductHeroAsideProps) {
  if (product === "standard-polls") return <PollsAside />;
  if (product === "standard-proof") return <ProofAside />;
  if (product === "standard-metrics") return <MetricsAside />;
  if (product === "standard-hook") return <HookAside />;
  if (product === "standard-release") return <ReleaseAside />;
  if (product === "standard-vault") return <VaultAside />;
  if (product === "standard-snippets") return <SnippetsAside />;
  if (product === "standard-status") return <StatusAside />;
  if (product === "standard-regex") return <RegexAside />;
  if (product === "standard-postmortem") return <PostmortemAside />;
  if (product === "standard-lens") return <LensAside />;
  if (product === "standard-cron") return <CronAside />;
  if (product === "standard-workspace") return <WorkspaceAside />;
  return <ReleaseAside />;
}

function PollsAside() {
  const urls = getPortfolioUrls();
  const options = [
    { label: "Standard Polls", href: urls.polls },
    { label: "Standard Proof", href: urls.proof },
    { label: "Standard Metrics", href: urls.metrics },
  ];

  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Live in Slack
        </div>
        <div className="mt-5 space-y-3 rounded-lg border border-white/[0.08] bg-black/40 p-4">
          <div className="flex items-center gap-2 text-xs text-[var(--ms-fog)]">
            <span className="h-2 w-2 rounded-full bg-[var(--ms-flood)]" />
            #product-feedback
          </div>
          <div className="rounded-md border border-white/[0.06] bg-[var(--ms-deep)] p-4">
            <p className="text-sm font-semibold">What should we build next?</p>
            <div className="mt-3 grid gap-2">
              {options.map((opt) => (
                <a
                  key={opt.label}
                  href={opt.href}
                  className="block rounded border border-[var(--ms-hairline)] px-3 py-2 text-xs text-[var(--ms-mist)] transition-colors hover:border-[var(--ms-flood)] hover:text-[var(--ms-flood-soft)]"
                >
                  {opt.label}
                </a>
              ))}
            </div>
            <p className="mt-4 border-t border-white/[0.06] pt-3 text-[10px] text-[var(--ms-fog)]">
              Powered by Market Standard — Add to Slack
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Command" value="/poll" />
          <StatusPill label="Votes" value="real-time" />
        </div>
      </div>
    </div>
  );
}

function ProofAside() {
  const quotes = [
    { name: "Alex Chen", text: "Effortless Wall of Love on our landing page." },
    { name: "Jordan Lee", text: "Setup took 5 minutes on Webflow." },
    { name: "Sam Rivera", text: "The badge drove new signups for us." },
  ];

  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Wall of Love
        </div>
        <div className="mt-5 space-y-3">
          {quotes.map((q) => (
            <blockquote key={q.name} className="rounded-lg border border-white/[0.08] bg-black/30 p-4">
              <p className="text-sm text-[var(--ms-mist)]">&ldquo;{q.text}&rdquo;</p>
              <footer className="mt-2 text-xs text-[var(--ms-fog)]">— {q.name}</footer>
            </blockquote>
          ))}
        </div>
        <a
          href="/c/demo"
          className="ms-btn ms-btn-gilt mt-4 inline-flex w-full text-xs sm:text-sm"
        >
          View demo wall
        </a>
      </div>
    </div>
  );
}

function MetricsAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Stripe snapshot
        </div>
        <div className="relative mt-5 grid aspect-square place-items-center rounded-full border border-[var(--ms-flood)]/30 bg-black/30">
          <div className="ms-orbit-outer absolute h-[72%] w-[72%] rounded-full border border-dashed border-[var(--ms-gilt)]/40" />
          <div className="ms-orbit-inner absolute h-[48%] w-[48%] rounded-full border border-dashed border-[var(--ms-flood)]/40" />
          <div className="text-center">
            <div className="text-4xl font-black text-[var(--ms-flood)]">$12.4k</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--ms-fog)]">MRR</div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatusPill label="ARR" value="$148.8k" />
          <StatusPill label="Churn" value="3.2%" />
          <StatusPill label="LTV" value="$387k" />
          <StatusPill label="Subs" value="142" />
        </div>
        <a
          href="/dashboard?connected=true"
          className="ms-btn ms-btn-primary mt-4 inline-flex w-full text-xs sm:text-sm"
        >
          Open demo dashboard
        </a>
      </div>
    </div>
  );
}

function HookAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Webhook inbox
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <p className="text-[var(--ms-fog)]">POST /api/capture/stripe-dev</p>
          <pre className="mt-3 overflow-x-auto text-[var(--ms-mist)]">{`{
  "type": "checkout.session.completed",
  "data": { ... }
}`}</pre>
          <p className="mt-3 border-t border-white/[0.06] pt-3 text-[var(--ms-flood)]">200 OK · stored</p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Method" value="ANY" />
          <StatusPill label="Replay" value="1-click" />
        </div>
      </div>
    </div>
  );
}

function ReleaseAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Release notes
        </div>
        <div className="mt-5 space-y-2 rounded-lg border border-white/[0.08] bg-black/30 p-4 text-sm">
          <p className="font-semibold text-[var(--ms-mist)]">v1.4.0</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-[var(--ms-fog)]">
            <li>Webhook inbox replay (#42)</li>
            <li>GitHub PR changelog (#38)</li>
            <li>Dashboard billing (#35)</li>
          </ul>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Source" value="GitHub" />
          <StatusPill label="Format" value="Markdown" />
        </div>
      </div>
    </div>
  );
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-fog)]">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold">{value}</div>
    </div>
  );
}

function VaultAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Env injection
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <p className="text-[var(--ms-fog)]">$ ms-vault run --token $VAULT_TOKEN \</p>
          <p className="text-[var(--ms-fog)] pl-3">--project proj_abc \</p>
          <p className="text-[var(--ms-fog)] pl-3">-- npm start</p>
          <pre className="mt-3 overflow-x-auto text-[var(--ms-mist)]">{`{
  "DATABASE_URL": "postgres://…",
  "STRIPE_SECRET_KEY": "sk_live_…",
  "OPENAI_API_KEY": "sk-…"
}`}</pre>
          <p className="mt-3 border-t border-white/[0.06] pt-3 text-[var(--ms-flood)]">
            200 OK · decrypted into child env
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Cipher" value="AES-256-GCM" />
          <StatusPill label="Agents" value="reference only" />
        </div>
      </div>
    </div>
  );
}

function SnippetsAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Snippet manager
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <p className="text-[var(--ms-fog)]">// debounce.ts</p>
          <pre className="mt-2 overflow-x-auto text-[var(--ms-mist)]">{`export function debounce<T>(
  fn: T, ms: number
) {
  let t: ReturnType<typeof setTimeout>;
  return (...a: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
}`}</pre>
          <div className="mt-3 flex flex-wrap gap-1">
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--ms-fog)]">#typescript</span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--ms-fog)]">#utility</span>
            <span className="rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-[var(--ms-fog)]">#react</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Versions" value="auto" />
          <StatusPill label="Share" value="signed URL" />
        </div>
      </div>
    </div>
  );
}

function StatusAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Build &amp; deploy health
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[var(--ms-fog)]">CI / Tests</span>
            <span className="text-[var(--ms-mist)]">●  success</span>
          </div>
          <div className="mt-2 flex gap-0.5">
            {["s", "s", "f", "s", "s", "s", "s", "s", "f", "s", "s", "s"].map((c, i) => (
              <span
                key={i}
                className={`h-6 w-1.5 rounded-sm ${c === "s" ? "bg-emerald-500/70" : c === "f" ? "bg-rose-500/70" : "bg-zinc-500/50"}`}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[var(--ms-fog)]">Vercel · production</span>
            <span className="text-[var(--ms-mist)]">●  ready</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[var(--ms-fog)]">
            <span>Incident · SEV3</span>
            <span className="rounded border border-amber-500/40 px-1.5 py-0.5 text-[10px] text-amber-300">resolved</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Sources" value="GH · Vercel · FG8" />
          <StatusPill label="30-run" value="92% pass" />
        </div>
      </div>
    </div>
  );
}

function RegexAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Regex builder + debugger
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <p className="text-[var(--ms-fog)]">/[\w.]+@[\w-]+\.[a-z]{"{2,}"}/gi</p>
          <div className="mt-3 rounded bg-black/40 p-2 text-[var(--ms-mist)]">
            Contact <mark className="ms-match">hello@marketstandard.app</mark><br />
            or <mark className="ms-match">team@marketstandard.io</mark>
          </div>
          <div className="mt-3 space-y-1 text-[var(--ms-fog)]">
            <p><span className="text-[var(--ms-gilt-light)]">[\\w.]+</span> — word chars + dots</p>
            <p><span className="text-[var(--ms-gilt-light)]">@</span> — literal @</p>
            <p><span className="text-[var(--ms-gilt-light)]">[a-z]{"{2,}"}</span> — TLD, 2+ lowercase</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Engine" value="JS RegExp" />
          <StatusPill label="Library" value="fork + share" />
        </div>
      </div>
    </div>
  );
}

function PostmortemAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Blameless postmortem
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 text-xs">
          <p className="text-[var(--ms-fog)] font-semibold">Stripe webhook delay · SEV3</p>
          <div className="mt-3 space-y-1 text-[var(--ms-mist)]">
            <p><span className="text-[var(--ms-gilt-light)]">Timeline</span> · 3 entries</p>
            <p><span className="text-[var(--ms-gilt-light)]">Root cause</span> · retry queue backpressure</p>
            <p><span className="text-[var(--ms-gilt-light)]">Actions</span> · 2 open, due in 7d / 14d</p>
          </div>
          <div className="mt-3 flex items-center justify-between rounded border border-amber-500/30 bg-amber-500/5 p-2">
            <span className="text-amber-300">↻ Recurrence detected</span>
            <span className="text-[var(--ms-fog)] text-[10px]">82% similar to Mar 14</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Intake" value="Hook · Status · Pulse" />
          <StatusPill label="Recurrence" value="pgvector / Jaccard" />
        </div>
      </div>
    </div>
  );
}

function LensAside() {
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Slow query optimizer
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          <p className="text-[var(--ms-fog)]">EXPLAIN ANALYZE</p>
          <pre className="mt-2 overflow-x-auto text-[var(--ms-mist)]">{`SELECT * FROM events
WHERE user_id = $1
  AND ts > now() - '7d'`}</pre>
          <div className="mt-3 flex items-center justify-between rounded border border-rose-500/30 bg-rose-500/5 p-2">
            <span className="text-rose-300">Seq scan · 4.2s</span>
            <span className="text-[var(--ms-fog)] text-[10px]">missing idx</span>
          </div>
          <div className="mt-3 flex items-center justify-between rounded border border-emerald-500/30 bg-emerald-500/5 p-2">
            <span className="text-emerald-300">Index scan · 38ms</span>
            <span className="text-[var(--ms-fog)] text-[10px]">+ idx(user_id, ts)</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Engine" value="Postgres + pgvector" />
          <StatusPill label="Fix" value="index suggestion" />
        </div>
      </div>
    </div>
  );
}

function CronAside() {
  const jobs = [
    { name: "stripe-sync", schedule: "*/5 * * * *", status: "ok", last: "2.1s" },
    { name: "digest-daily", schedule: "0 9 * * *", status: "ok", last: "12s" },
    { name: "standup-prompt", schedule: "0 10 * * 1-5", status: "late", last: "—" },
  ];
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(197,165,90,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          Cron monitor
        </div>
        <div className="mt-5 space-y-2 rounded-lg border border-white/[0.08] bg-black/40 p-4 font-mono text-xs">
          {jobs.map((job) => (
            <div key={job.name} className="flex items-center justify-between gap-2">
              <span className="truncate text-[var(--ms-mist)]">{job.name}</span>
              <span className="text-[var(--ms-fog)] text-[10px]">{job.schedule}</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] ${
                  job.status === "ok"
                    ? "border border-emerald-500/40 text-emerald-300"
                    : "border border-amber-500/40 text-amber-300"
                }`}
              >
                {job.status === "ok" ? `OK ${job.last}` : "LATE"}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Sources" value="Vercel Cron · pg_cron" />
          <StatusPill label="Alerts" value="Slack + email" />
        </div>
      </div>
    </div>
  );
}

function WorkspaceAside() {
  const apps = [
    { name: "polls", health: "ok" },
    { name: "proof", health: "ok" },
    { name: "metrics", health: "ok" },
    { name: "hook", health: "ok" },
    { name: "release", health: "ok" },
    { name: "vault", health: "ok" },
    { name: "links", health: "ok" },
    { name: "snippets", health: "ok" },
    { name: "status", health: "warn" },
    { name: "regex", health: "ok" },
    { name: "postmortem", health: "ok" },
    { name: "lens", health: "ok" },
    { name: "cron", health: "ok" },
    { name: "workspace", health: "ok" },
  ];
  return (
    <div className="ms-panel relative overflow-hidden p-5 md:p-7">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(57,255,20,0.12),transparent_45%)]" />
      <div className="relative z-10">
        <div className="font-mono text-[10px] uppercase tracking-[0.35em] text-[var(--ms-gilt-light)]">
          14-app status grid
        </div>
        <div className="mt-5 rounded-lg border border-white/[0.08] bg-black/40 p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {apps.map((app) => (
              <div
                key={app.name}
                className={`flex h-7 items-center justify-center rounded text-[9px] font-mono ${
                  app.health === "ok"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-amber-500/15 text-amber-300"
                }`}
                title={app.name}
              >
                {app.name.slice(0, 2)}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-[var(--ms-fog)]">
            <span>13 ok · 1 warn</span>
            <span className="text-[var(--ms-flood)]">SSE live</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <StatusPill label="Externals" value="FloodG8 · Supabase · Stripe" />
          <StatusPill label="Tunnels" value="Cloudflare" />
        </div>
      </div>
    </div>
  );
}
