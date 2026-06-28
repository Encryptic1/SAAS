import { fetchGateway, getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { metricSnapshots, quotaSamples, stripeAccounts } from "@market-standard/db/schema/metrics";
import { and, desc, eq, gte, lte, sql } from "@market-standard/db/query";

export interface SnapshotRow {
  id: string;
  snapshotDate: Date;
  mrr: number;
  arr: number;
  churnRate: number;
  ltv: number;
  activeSubscriptions: number;
  breakdown: Record<string, unknown> | null;
}

export interface MetricsOverview {
  latest: SnapshotRow | null;
  previous: SnapshotRow | null;
  series: SnapshotRow[];
  accountId: string;
}

function mapSnapshot(row: {
  id: string;
  snapshotDate: Date;
  mrr: string;
  arr: string;
  churnRate: string | null;
  ltv: string | null;
  activeSubscriptions: number;
  breakdown: Record<string, unknown> | null;
}): SnapshotRow {
  return {
    id: row.id,
    snapshotDate: row.snapshotDate,
    mrr: Number(row.mrr),
    arr: Number(row.arr),
    churnRate: Number(row.churnRate ?? 0),
    ltv: Number(row.ltv ?? 0),
    activeSubscriptions: row.activeSubscriptions,
    breakdown: row.breakdown,
  };
}

export async function loadMetricsOverview(): Promise<MetricsOverview> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      account: { stripeAccountId: string } | null;
      snapshots: Array<{
        id: string;
        snapshotDate: string;
        mrr: number;
        arr: number;
        churnRate: number;
        ltv: number;
        activeSubscriptions: number;
        breakdown: Record<string, unknown> | null;
      }>;
    }>("/metrics/snapshots");

    const series = data.snapshots.map((s) => ({
      id: s.id,
      snapshotDate: new Date(s.snapshotDate),
      mrr: s.mrr,
      arr: s.arr,
      churnRate: s.churnRate,
      ltv: s.ltv,
      activeSubscriptions: s.activeSubscriptions,
      breakdown: s.breakdown,
    }));

    return {
      latest: series[0] ?? null,
      previous: series[1] ?? null,
      series,
      accountId: data.account?.stripeAccountId ?? "",
    };
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    return { latest: null, previous: null, series: [], accountId: "" };
  }

  const rows = await db
    .select()
    .from(metricSnapshots)
    .where(eq(metricSnapshots.stripeAccountId, account.id))
    .orderBy(desc(metricSnapshots.snapshotDate))
    .limit(30);

  const series = rows.map(mapSnapshot);
  return {
    latest: series[0] ?? null,
    previous: series[1] ?? null,
    series,
    accountId: account.stripeAccountId,
  };
}

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "ytd";

export interface AnalyticsBreakdownRow {
  label: string;
  mrr: number;
  subs: number;
}

export interface AnalyticsData {
  account: { stripeAccountId: string } | null;
  period: AnalyticsPeriod;
  current: SnapshotRow[];
  previous: SnapshotRow[];
  deltas: {
    mrr: number;
    arr: number;
    activeSubscriptions: number;
    churnRate: number;
    ltv: number;
  } | null;
  breakdown: AnalyticsBreakdownRow[];
}

export async function loadAnalytics(period: AnalyticsPeriod = "30d"): Promise<AnalyticsData> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      account: { stripeAccountId: string } | null;
      period: AnalyticsPeriod;
      current: Array<{
        id: string;
        snapshotDate: string;
        mrr: number;
        arr: number;
        churnRate: number;
        ltv: number;
        activeSubscriptions: number;
        breakdown: Record<string, unknown> | null;
      }>;
      previous: Array<{
        id: string;
        snapshotDate: string;
        mrr: number;
        arr: number;
        churnRate: number;
        ltv: number;
        activeSubscriptions: number;
      }>;
      deltas: AnalyticsData["deltas"];
      breakdown: AnalyticsBreakdownRow[];
    }>(`/metrics/analytics?period=${period}`);

    return {
      account: data.account,
      period: data.period,
      current: data.current.map((s) => ({
        id: s.id,
        snapshotDate: new Date(s.snapshotDate),
        mrr: s.mrr,
        arr: s.arr,
        churnRate: s.churnRate,
        ltv: s.ltv,
        activeSubscriptions: s.activeSubscriptions,
        breakdown: s.breakdown,
      })),
      previous: data.previous.map((s) => ({
        id: s.id,
        snapshotDate: new Date(s.snapshotDate),
        mrr: s.mrr,
        arr: s.arr,
        churnRate: s.churnRate,
        ltv: s.ltv,
        activeSubscriptions: s.activeSubscriptions,
        breakdown: null,
      })),
      deltas: data.deltas,
      breakdown: data.breakdown,
    };
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    return { account: null, period, current: [], previous: [], deltas: null, breakdown: [] };
  }

  const daysMap: Record<AnalyticsPeriod, number> = { "7d": 7, "30d": 30, "90d": 90, ytd: 365 };
  const days = daysMap[period];
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevStart = new Date(periodStart.getTime() - days * 24 * 60 * 60 * 1000);

  const currentRows = await db
    .select()
    .from(metricSnapshots)
    .where(and(eq(metricSnapshots.stripeAccountId, account.id), gte(metricSnapshots.snapshotDate, periodStart)))
    .orderBy(desc(metricSnapshots.snapshotDate));
  const previousRows = await db
    .select()
    .from(metricSnapshots)
    .where(
      and(
        eq(metricSnapshots.stripeAccountId, account.id),
        gte(metricSnapshots.snapshotDate, prevStart),
        lte(metricSnapshots.snapshotDate, periodStart),
      ),
    )
    .orderBy(desc(metricSnapshots.snapshotDate));

  const curr = currentRows[0];
  const prev = previousRows[0];
  const deltas = curr && prev
    ? {
        mrr: Number(curr.mrr) - Number(prev.mrr),
        arr: Number(curr.arr) - Number(prev.arr),
        activeSubscriptions: curr.activeSubscriptions - prev.activeSubscriptions,
        churnRate: Number(curr.churnRate ?? 0) - Number(prev.churnRate ?? 0),
        ltv: Number(curr.ltv ?? 0) - Number(prev.ltv ?? 0),
      }
    : null;

  const breakdownMap = new Map<string, { mrr: number; subs: number }>();
  for (const row of currentRows) {
    const b = (row.breakdown ?? {}) as Record<string, { mrr?: number; activeSubscriptions?: number }>;
    for (const [key, val] of Object.entries(b)) {
      const existing = breakdownMap.get(key) ?? { mrr: 0, subs: 0 };
      existing.mrr += Number(val?.mrr ?? 0);
      existing.subs += Number(val?.activeSubscriptions ?? 0);
      breakdownMap.set(key, existing);
    }
  }
  const breakdown = Array.from(breakdownMap.entries())
    .map(([label, v]) => ({ label, mrr: v.mrr, subs: v.subs }))
    .sort((a, b) => b.mrr - a.mrr);

  return {
    account,
    period,
    current: currentRows.map(mapSnapshot),
    previous: previousRows.map(mapSnapshot),
    deltas,
    breakdown,
  };
}

export interface QuotaSampleRow {
  id: string;
  source: string;
  quotaLabel: string;
  used: number;
  limit: number | null;
  windowStartedAt: Date;
  windowEndsAt: Date | null;
  metadata: Record<string, unknown> | null;
  sampledAt: Date;
}

export interface QuotaSnapshot {
  source: string;
  samples: QuotaSampleRow[];
}

export async function loadQuotaSnapshots(): Promise<{ account: { stripeAccountId: string } | null; latest: QuotaSnapshot[] }> {
  if (isLocalGatewayMode()) {
    const data = await fetchGateway<{
      account: { stripeAccountId: string } | null;
      latest: Array<{ source: string; samples: Array<Omit<QuotaSampleRow, "windowStartedAt" | "windowEndsAt" | "sampledAt"> & { windowStartedAt: string; windowEndsAt: string | null; sampledAt: string }> }>;
    }>("/metrics/quota");
    return {
      account: data.account,
      latest: data.latest.map((g) => ({
        source: g.source,
        samples: g.samples.map((s) => ({
          ...s,
          windowStartedAt: new Date(s.windowStartedAt),
          windowEndsAt: s.windowEndsAt ? new Date(s.windowEndsAt) : null,
          sampledAt: new Date(s.sampledAt),
        })),
      })),
    };
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  const conds = [];
  if (account) conds.push(eq(quotaSamples.stripeAccountId, account.id));
  const rows = await db
    .select()
    .from(quotaSamples)
    .where(conds.length ? (conds.length === 1 ? conds[0] : and(...conds)) : sql`true`)
    .orderBy(desc(quotaSamples.sampledAt))
    .limit(100);

  const bySource = new Map<string, QuotaSampleRow[]>();
  for (const r of rows) {
    const list = bySource.get(r.source) ?? [];
    list.push({
      id: r.id,
      source: r.source,
      quotaLabel: r.quotaLabel,
      used: r.used,
      limit: r.limit,
      windowStartedAt: r.windowStartedAt,
      windowEndsAt: r.windowEndsAt,
      metadata: r.metadata,
      sampledAt: r.sampledAt,
    });
    bySource.set(r.source, list);
  }
  return {
    account: account ? { stripeAccountId: account.stripeAccountId } : null,
    latest: Array.from(bySource.entries()).map(([source, samples]) => ({ source, samples })),
  };
}

export async function recordQuotaSample(input: {
  source: string;
  quotaLabel: string;
  used: number;
  limit?: number | null;
  windowStartedAt?: Date;
  windowEndsAt?: Date | null;
  metadata?: Record<string, unknown>;
}): Promise<{ ok: true }> {
  if (isLocalGatewayMode()) {
    await postGateway<{ sample: unknown }>("/metrics/quota", {
      source: input.source,
      quotaLabel: input.quotaLabel,
      used: input.used,
      limit: input.limit ?? null,
      windowStartedAt: (input.windowStartedAt ?? new Date()).toISOString(),
      windowEndsAt: input.windowEndsAt ? input.windowEndsAt.toISOString() : null,
      metadata: input.metadata ?? {},
    });
    return { ok: true };
  }

  const db = await getDbAsync();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  await db.insert(quotaSamples).values({
    stripeAccountId: account?.id,
    source: input.source,
    quotaLabel: input.quotaLabel,
    used: input.used,
    limit: input.limit ?? null,
    windowStartedAt: input.windowStartedAt ?? new Date(),
    windowEndsAt: input.windowEndsAt ?? null,
    metadata: input.metadata ?? {},
  });
  return { ok: true };
}

export function formatDelta(current: number, previous: number, invert = false): {
  text: string;
  positive?: boolean;
} {
  if (!previous) return { text: "No prior period" };
  const pct = ((current - previous) / previous) * 100;
  const sign = pct >= 0 ? "+" : "";
  const positive = invert ? pct <= 0 : pct >= 0;
  return { text: `${sign}${pct.toFixed(1)}% vs prior`, positive };
}
