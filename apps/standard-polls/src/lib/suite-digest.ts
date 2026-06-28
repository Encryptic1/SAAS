import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { polls, votes, workspaces } from "@market-standard/db/schema/polls";
import { digestConfigs } from "@market-standard/db/schema/shared";
import { metricSnapshots, stripeAccounts } from "@market-standard/db/schema/metrics";
import { linkRecords } from "@market-standard/db/schema/links";
import { count, desc, eq, gte, sql } from "@market-standard/db/query";

export type DigestSource = "polls" | "metrics" | "floodg8" | "syncdevtime" | "links";

export interface DigestConfig {
  id: string;
  ownerId: string;
  slackWorkspaceId: string | null;
  slackChannelId: string | null;
  frequency: string;
  sources: DigestSource[];
  enabled: boolean;
}

export interface DigestPeriod {
  days: number;
  start: Date;
  end: Date;
  label: string;
}

export interface PollsDigestSection {
  newPolls: number;
  totalVotes: number;
  topPoll: { question: string; votes: number } | null;
}

export interface MetricsDigestSection {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  churnRate: number;
  mrrDelta: number;
  stripeAccountId: string | null;
}

export interface LinksDigestSection {
  totalLinks: number;
  totalClicks: number;
  clicksInPeriod: number;
  topLink: { name: string; clicks: number; slug: string } | null;
}

export interface FloodG8DigestSection {
  totalAgentReports: number;
  totalAgentCost: number;
  topAgent: { name: string; reports: number } | null;
}

export interface SyncDevTimeDigestSection {
  engineeringHours: number;
  topProject: string | null;
  note: string;
}

export interface DigestPayload {
  period: DigestPeriod;
  polls: PollsDigestSection | null;
  metrics: MetricsDigestSection | null;
  links: LinksDigestSection | null;
  floodg8: FloodG8DigestSection | null;
  syncdevtime: SyncDevTimeDigestSection | null;
}

export async function listEnabledDigestConfigs(): Promise<DigestConfig[]> {
  if (isLocalGatewayMode()) {
    // No gateway route for digest_configs yet — return a single demo config so the cron
    // still produces a useful Slack message in local dev.
    return [
      {
        id: "local-dev-config",
        ownerId: "local-dev",
        slackWorkspaceId: null,
        slackChannelId: process.env.DIGEST_SLACK_CHANNEL_ID ?? "#suite-digest",
        frequency: "weekly",
        sources: ["polls", "metrics", "links", "floodg8", "syncdevtime"],
        enabled: true,
      },
    ];
  }

  const db = await getDbAsync();
  const rows = await db
    .select()
    .from(digestConfigs)
    .where(eq(digestConfigs.enabled, true));
  return rows.map((r) => ({
    id: r.id,
    ownerId: r.ownerId,
    slackWorkspaceId: r.slackWorkspaceId ?? null,
    slackChannelId: r.slackChannelId ?? null,
    frequency: r.frequency,
    sources: (r.sources as DigestSource[]) ?? [],
    enabled: r.enabled,
  }));
}

function periodFor(frequency: string): DigestPeriod {
  const days = frequency === "daily" ? 1 : frequency === "monthly" ? 30 : 7;
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { days, start, end, label: frequency };
}

export async function gatherPollsSection(period: DigestPeriod): Promise<PollsDigestSection> {
  if (isLocalGatewayMode()) {
    const list = await fetchGateway<Array<{ question: string; voteCount: number }>>("/polls/list").catch(
      () => [],
    );
    const totalVotes = list.reduce((acc, p) => acc + p.voteCount, 0);
    const topPoll = list[0] ? { question: list[0].question, votes: list[0].voteCount } : null;
    return { newPolls: list.length, totalVotes, topPoll };
  }

  const db = await getDbAsync();
  const [ws] = await db.select().from(workspaces).limit(1);
  if (!ws) return { newPolls: 0, totalVotes: 0, topPoll: null };

  const [newPollsRow] = await db
    .select({ count: count() })
    .from(polls)
    .where(gte(polls.createdAt, period.start));
  const newPolls = newPollsRow?.count ?? 0;

  const recentPolls = await db
    .select()
    .from(polls)
    .where(gte(polls.createdAt, period.start))
    .orderBy(desc(polls.createdAt))
    .limit(20);

  let totalVotes = 0;
  const perPoll: Array<{ question: string; votes: number }> = [];
  for (const p of recentPolls) {
    const [v] = await db.select({ count: count() }).from(votes).where(eq(votes.pollId, p.id));
    const votesForPoll = v?.count ?? 0;
    totalVotes += votesForPoll;
    perPoll.push({ question: p.question, votes: votesForPoll });
  }
  perPoll.sort((a, b) => b.votes - a.votes);
  return {
    newPolls,
    totalVotes,
    topPoll: perPoll[0] ?? null,
  };
}

export async function gatherMetricsSection(_period: DigestPeriod): Promise<MetricsDigestSection> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      account: { stripeAccountId: string } | null;
      snapshots: Array<{
        mrr: number;
        arr: number;
        churnRate: number;
        activeSubscriptions: number;
      }>;
    }>("/metrics/snapshots").catch(() => ({
      account: null,
      snapshots: [],
    }));
    const latest = data.snapshots[0];
    const prev = data.snapshots[1];
    return {
      mrr: latest?.mrr ?? 0,
      arr: latest?.arr ?? 0,
      activeSubscriptions: latest?.activeSubscriptions ?? 0,
      churnRate: latest?.churnRate ?? 0,
      mrrDelta: latest && prev ? latest.mrr - prev.mrr : 0,
      stripeAccountId: data.account?.stripeAccountId ?? null,
    };
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    return {
      mrr: 0,
      arr: 0,
      activeSubscriptions: 0,
      churnRate: 0,
      mrrDelta: 0,
      stripeAccountId: null,
    };
  }
  const rows = await db
    .select()
    .from(metricSnapshots)
    .where(eq(metricSnapshots.stripeAccountId, account.id))
    .orderBy(desc(metricSnapshots.snapshotDate))
    .limit(2);
  const latest = rows[0];
  const prev = rows[1];
  return {
    mrr: Number(latest?.mrr ?? 0),
    arr: Number(latest?.arr ?? 0),
    activeSubscriptions: latest?.activeSubscriptions ?? 0,
    churnRate: Number(latest?.churnRate ?? 0),
    mrrDelta: latest && prev ? Number(latest.mrr) - Number(prev.mrr) : 0,
    stripeAccountId: account.stripeAccountId,
  };
}

export async function gatherLinksSection(period: DigestPeriod): Promise<LinksDigestSection> {
  if (isLocalGatewayMode()) {
    const rows = await fetchGateway<Array<{ name: string; clickCount: number; slug: string; lastClickedAt: string | null }>>(
      "/links/links",
    ).catch(() => []);
    const totalClicks = rows.reduce((acc, r) => acc + r.clickCount, 0);
    const clicksInPeriod = rows.filter(
      (r) => r.lastClickedAt && new Date(r.lastClickedAt) >= period.start,
    ).reduce((acc, r) => acc + r.clickCount, 0);
    const top = rows.slice().sort((a, b) => b.clickCount - a.clickCount)[0];
    return {
      totalLinks: rows.length,
      totalClicks,
      clicksInPeriod,
      topLink: top ? { name: top.name, clicks: top.clickCount, slug: top.slug } : null,
    };
  }

  const db = await getDbAsync();
  const rows = await db.select().from(linkRecords).orderBy(desc(linkRecords.clickCount));
  const totalClicks = rows.reduce((acc, r) => acc + r.clickCount, 0);
  const clicksInPeriod = rows
    .filter((r) => r.lastClickedAt && new Date(r.lastClickedAt) >= period.start)
    .reduce((acc, r) => acc + r.clickCount, 0);
  const top = rows[0];
  return {
    totalLinks: rows.length,
    totalClicks,
    clicksInPeriod,
    topLink: top ? { name: top.name, clicks: top.clickCount, slug: top.slug } : null,
  };
}

export async function gatherFloodG8Section(_period: DigestPeriod): Promise<FloodG8DigestSection> {
  // Until Suite Pulse ships (Phase B), FloodG8 exposes a public /api/portfolio/summary endpoint
  // we can hit. In local dev we return zeros so the digest still composes.
  const floodg8Url = process.env.NEXT_PUBLIC_FLOODG8_URL ?? "https://floodg8.com";
  try {
    const res = await fetch(`${floodg8Url}/api/portfolio/summary`, {
      headers: { "x-portfolio-secret": process.env.PORTFOLIO_API_SECRET ?? "" },
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        totalAgentReports?: number;
        totalAgentCost?: number;
        topAgent?: { name: string; reports: number };
      };
      return {
        totalAgentReports: data.totalAgentReports ?? 0,
        totalAgentCost: data.totalAgentCost ?? 0,
        topAgent: data.topAgent ?? null,
      };
    }
  } catch {
    // fall through to defaults
  }
  return { totalAgentReports: 0, totalAgentCost: 0, topAgent: null };
}

export async function gatherSyncDevTimeSection(_period: DigestPeriod): Promise<SyncDevTimeDigestSection> {
  const syncUrl = process.env.NEXT_PUBLIC_SYNCDEVTIME_URL ?? "https://syncdevtime.com";
  try {
    const res = await fetch(`${syncUrl}/api/summary`, {
      headers: { "x-sync-secret": process.env.SYNCDEVTIME_API_SECRET ?? "" },
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        engineeringHours?: number;
        topProject?: string;
      };
      return {
        engineeringHours: data.engineeringHours ?? 0,
        topProject: data.topProject ?? null,
        note: "Live from SyncDevTime",
      };
    }
  } catch {
    // fall through
  }
  return {
    engineeringHours: 0,
    topProject: null,
    note: "SyncDevTime API not configured — set SYNCDEVTIME_API_SECRET to enable.",
  };
}

export async function composeDigest(sources: DigestSource[], frequency: string): Promise<DigestPayload> {
  const period = periodFor(frequency);
  const [polls, metrics, links, floodg8, syncdevtime] = await Promise.all([
    sources.includes("polls") ? gatherPollsSection(period) : Promise.resolve(null),
    sources.includes("metrics") ? gatherMetricsSection(period) : Promise.resolve(null),
    sources.includes("links") ? gatherLinksSection(period) : Promise.resolve(null),
    sources.includes("floodg8") ? gatherFloodG8Section(period) : Promise.resolve(null),
    sources.includes("syncdevtime") ? gatherSyncDevTimeSection(period) : Promise.resolve(null),
  ]);
  return { period, polls, metrics, links, floodg8, syncdevtime };
}

function money(n: number): string {
  const sign = n >= 0 ? "" : "-";
  return `${sign}$${Math.abs(Math.round(n)).toLocaleString()}`;
}

function pct(n: number, digits = 2): string {
  return `${(n * 100).toFixed(digits)}%`;
}

export function renderDigestBlocks(payload: DigestPayload): unknown[] {
  const blocks: unknown[] = [];
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: `Market Standard Suite Digest — ${payload.period.label}` },
  });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: `Window: ${payload.period.start.toLocaleDateString()} → ${payload.period.end.toLocaleDateString()}`,
      },
    ],
  });

  if (payload.polls) {
    const p = payload.polls;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:bar_chart: *Standard Polls* — ${p.newPolls} new poll${p.newPolls === 1 ? "" : "s"}, ${p.totalVotes} vote${p.totalVotes === 1 ? "" : "s"}${p.topPoll ? `\n> Top: *${p.topPoll.question}* (${p.topPoll.votes} votes)` : ""}`,
      },
    });
  }

  if (payload.metrics) {
    const m = payload.metrics;
    const deltaStr = m.mrrDelta === 0 ? "no change" : `${m.mrrDelta >= 0 ? "+" : ""}${money(m.mrrDelta)}`;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:moneybag: *Standard Metrics* — MRR ${money(m.mrr)} (${deltaStr}), ARR ${money(m.arr)}, ${m.activeSubscriptions} active subs, churn ${pct(m.churnRate)}${m.stripeAccountId ? `\n> Account: \`${m.stripeAccountId}\`` : ""}`,
      },
    });
  }

  if (payload.links) {
    const l = payload.links;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:link: *Standard Links* — ${l.totalLinks} links, ${l.totalClicks} total clicks, ${l.clicksInPeriod} in window${l.topLink ? `\n> Top: *${l.topLink.name}* — ${l.topLink.clicks} clicks (\`/go/${l.topLink.slug}\`)` : ""}`,
      },
    });
  }

  if (payload.floodg8) {
    const f = payload.floodg8;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:brain: *FloodG8 Suite Pulse* — ${f.totalAgentReports} agent report${f.totalAgentReports === 1 ? "" : "s"}, ${money(f.totalAgentCost)} AI spend${f.topAgent ? `\n> Top: *${f.topAgent.name}* (${f.topAgent.reports} reports)` : ""}`,
      },
    });
  }

  if (payload.syncdevtime) {
    const s = payload.syncdevtime;
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:clock1: *SyncDevTime* — ${s.engineeringHours} engineering hour${s.engineeringHours === 1 ? "" : "s"}${s.topProject ? `, top project *${s.topProject}*` : ""}\n> ${s.note}`,
      },
    });
  }

  blocks.push({
    type: "divider",
  });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "Composed by Market Standard Suite · `POST /api/cron/digest`",
      },
    ],
  });

  return blocks;
}

export async function postDigestToSlack(
  channelId: string,
  blocks: unknown[],
): Promise<{ ok: boolean; ts?: string; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return { ok: false, error: "SLACK_BOT_TOKEN not set" };
  }
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId, blocks }),
  });
  const data = (await res.json()) as { ok: boolean; ts?: string; error?: string };
  return data;
}

export async function runDigestCron(): Promise<{
  configsProcessed: number;
  posts: Array<{ channelId: string; ok: boolean; error?: string }>;
}> {
  const configs = await listEnabledDigestConfigs();
  const posts: Array<{ channelId: string; ok: boolean; error?: string }> = [];

  for (const cfg of configs) {
    if (!cfg.slackChannelId) continue;
    const payload = await composeDigest(cfg.sources, cfg.frequency);
    const blocks = renderDigestBlocks(payload);
    const result = await postDigestToSlack(cfg.slackChannelId, blocks);
    posts.push({
      channelId: cfg.slackChannelId,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  return { configsProcessed: configs.length, posts };
}

// Suppress unused-import warnings for re-exports used by callers
void sql;
void getDbAsync;
