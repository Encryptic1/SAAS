import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { count, desc, eq, and, gte, lte, sql } from "drizzle-orm";
import { getPgliteDb } from "../packages/db/src/local";
import {
  metricSnapshots,
  paymentLinks,
  quotaSamples,
  stripeAccounts,
} from "../packages/db/src/schema/metrics";
import { polls, votes, workspaces } from "../packages/db/src/schema/polls";
import { standupPrompts, standupResponses } from "../packages/db/src/schema/standup";
import { collections, testimonials } from "../packages/db/src/schema/proof";
import { billingCustomers, kpiEvents } from "../packages/db/src/schema/shared";
import { webhookEvents, webhookInboxes } from "../packages/db/src/schema/hook";
import { releaseNotes, releaseRepos } from "../packages/db/src/schema/release";
import { linkClickEvents, linkRecords } from "../packages/db/src/schema/links";
import { vaultProjects, vaultSecrets, vaultAuditLog, vaultTokens } from "../packages/db/src/schema/vault";
import { encryptSecret, decryptSecret, hashToken, generateToken } from "../packages/db/src/vault-crypto";
import { snippets, snippetVersions, snippetShares } from "../packages/db/src/schema/snippets";
import { pipelines, deployments, incidents } from "../packages/db/src/schema/status";
import { patterns, patternForks } from "../packages/db/src/schema/regex";
import {
  postmortemIncidents as pmIncidents,
  postmortemActionItems as pmActionItems,
  postmortemRecurrenceLinks as pmRecurrenceLinks,
} from "../packages/db/src/schema/postmortem";

type TestCase = { input: string; expectedMatches: number | null; note?: string };
type TimelineEntry = { at: string; text: string };
type PostmortemSections = { whatWentWell: string; whatDidnt: string; whereWeGotLucky: string };

const PORT = Number(process.env.DB_GATEWAY_PORT ?? 4000);

const app = new Hono();

app.get("/health", async (c) => {
  const db = await getPgliteDb();
  await db.execute("SELECT 1");
  return c.json({ status: "ok", driver: "pglite-in-process", port: PORT });
});

app.get("/polls/stats", async (c) => {
  const db = await getPgliteDb();
  const [ws] = await db.select({ count: count() }).from(workspaces);
  const [ps] = await db.select({ count: count() }).from(polls);
  const [vs] = await db.select({ count: count() }).from(votes);
  return c.json({ workspaces: ws?.count ?? 0, polls: ps?.count ?? 0, votes: vs?.count ?? 0 });
});

app.get("/polls/workspace", async (c) => {
  const db = await getPgliteDb();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return c.json({ showBadge: true, plan: "free", slackTeamName: null });
  }
  return c.json({
    showBadge: workspace.showBadge,
    plan: workspace.plan,
    slackTeamName: workspace.slackTeamName,
  });
});

app.patch("/polls/workspace", async (c) => {
  const body = await c.req.json<{ showBadge?: boolean }>();
  const db = await getPgliteDb();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return c.json({ error: "No workspace" }, 404);
  }
  const [updated] = await db
    .update(workspaces)
    .set({ showBadge: body.showBadge ?? workspace.showBadge, updatedAt: new Date() })
    .where(eq(workspaces.id, workspace.id))
    .returning();
  return c.json({
    showBadge: updated!.showBadge,
    plan: updated!.plan,
    slackTeamName: updated!.slackTeamName,
  });
});

app.get("/polls/list", async (c) => {
  const db = await getPgliteDb();
  const rows = await db
    .select({
      id: polls.id,
      question: polls.question,
      options: polls.options,
      channelId: polls.channelId,
      createdAt: polls.createdAt,
      workspaceName: workspaces.slackTeamName,
    })
    .from(polls)
    .leftJoin(workspaces, eq(polls.workspaceId, workspaces.id))
    .orderBy(desc(polls.createdAt))
    .limit(50);

  const withVotes = await Promise.all(
    rows.map(async (row) => {
      const [vc] = await db.select({ count: count() }).from(votes).where(eq(votes.pollId, row.id));
      return { ...row, voteCount: vc?.count ?? 0 };
    }),
  );

  return c.json(withVotes);
});

app.get("/polls/analytics", async (c) => {
  const db = await getPgliteDb();
  const events = await db
    .select({ event: kpiEvents.event, count: count() })
    .from(kpiEvents)
    .where(eq(kpiEvents.product, "standard-polls"))
    .groupBy(kpiEvents.event);

  const pollRows = await db
    .select({
      id: polls.id,
      question: polls.question,
      options: polls.options,
      channelId: polls.channelId,
      createdAt: polls.createdAt,
      workspaceName: workspaces.slackTeamName,
    })
    .from(polls)
    .leftJoin(workspaces, eq(polls.workspaceId, workspaces.id))
    .orderBy(desc(polls.createdAt))
    .limit(5);

  const topPolls = await Promise.all(
    pollRows.map(async (row) => {
      const [vc] = await db.select({ count: count() }).from(votes).where(eq(votes.pollId, row.id));
      return { ...row, voteCount: vc?.count ?? 0 };
    }),
  );

  return c.json({ events, topPolls });
});

app.get("/polls/standup/prompts", async (c) => {
  const db = await getPgliteDb();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) return c.json([]);
  const rows = await db
    .select({
      id: standupPrompts.id,
      channelId: standupPrompts.channelId,
      scheduleCron: standupPrompts.scheduleCron,
      questions: standupPrompts.questions,
      enabled: standupPrompts.enabled,
    })
    .from(standupPrompts)
    .where(eq(standupPrompts.workspaceId, workspace.id))
    .orderBy(desc(standupPrompts.createdAt));
  return c.json(rows);
});

app.post("/polls/standup/prompts", async (c) => {
  const body = await c.req.json<{
    channelId?: string;
    scheduleCron?: string;
    questions?: string[];
  }>();
  const db = await getPgliteDb();
  let [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    [workspace] = await db
      .insert(workspaces)
      .values({
        slackTeamId: "T_LOCAL_DEFAULT",
        slackTeamName: "Local Dev Workspace",
        botToken: "xoxb-local-mock",
        plan: "free",
        showBadge: true,
      })
      .returning();
  }
  const [prompt] = await db
    .insert(standupPrompts)
    .values({
      workspaceId: workspace!.id,
      channelId: body.channelId ?? "C_GENERAL",
      scheduleCron: body.scheduleCron ?? "0 9 * * 1-5",
      questions: body.questions ?? [],
      enabled: true,
    })
    .returning();
  return c.json({ prompt });
});

app.patch("/polls/standup/prompts/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ enabled?: boolean; questions?: string[] }>();
  const db = await getPgliteDb();
  const [prompt] = await db
    .update(standupPrompts)
    .set({
      ...(body.enabled !== undefined ? { enabled: body.enabled } : {}),
      ...(body.questions !== undefined ? { questions: body.questions } : {}),
    })
    .where(eq(standupPrompts.id, id))
    .returning();
  if (!prompt) return c.json({ error: "Not found" }, 404);
  return c.json({ prompt });
});

app.get("/polls/standup/responses", async (c) => {
  const promptId = c.req.query("promptId");
  const daysStr = c.req.query("days");
  const days = daysStr ? Math.max(1, Number(daysStr)) : 1;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const db = await getPgliteDb();
  const conds = [gte(standupResponses.submittedAt, since)];
  if (promptId) conds.push(eq(standupResponses.promptId, promptId));
  const rows = await db
    .select()
    .from(standupResponses)
    .where(conds.length === 2 ? and(...conds) : conds[0])
    .orderBy(desc(standupResponses.submittedAt));
  return c.json({ responses: rows });
});

app.post("/polls/standup/responses", async (c) => {
  const body = await c.req.json<{ promptId?: string; slackUserId?: string; answers?: string[] }>();
  if (!body.promptId || !body.slackUserId || !body.answers?.length) {
    return c.json({ error: "promptId, slackUserId, answers required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(standupResponses)
    .values({
      promptId: body.promptId,
      slackUserId: body.slackUserId,
      answers: body.answers,
    })
    .returning();
  return c.json({ response: row }, 201);
});

app.post("/polls/slack-poll", async (c) => {
  const body = await c.req.json<{
    teamId: string;
    channelId: string;
    createdBy: string;
    question: string;
    options: string[];
  }>();
  const db = await getPgliteDb();
  let [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slackTeamId, body.teamId))
    .limit(1);

  if (!workspace) {
    [workspace] = await db
      .insert(workspaces)
      .values({
        slackTeamId: body.teamId,
        slackTeamName: "Slack Workspace",
        botToken: "xoxb-local-mock",
        plan: "free",
        showBadge: true,
      })
      .returning();
  }

  const [poll] = await db
    .insert(polls)
    .values({
      workspaceId: workspace!.id,
      channelId: body.channelId,
      question: body.question,
      options: body.options,
      createdBy: body.createdBy,
      isAnonymous: false,
    })
    .returning();

  return c.json({ poll });
});

app.post("/polls/vote", async (c) => {
  const body = await c.req.json<{ pollId: string; slackUserId: string; optionIndex: number }>();
  const db = await getPgliteDb();
  const [existing] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.pollId, body.pollId), eq(votes.slackUserId, body.slackUserId)))
    .limit(1);

  if (existing) {
    await db
      .update(votes)
      .set({ optionIndex: body.optionIndex, votedAt: new Date() })
      .where(eq(votes.id, existing.id));
  } else {
    await db.insert(votes).values({
      pollId: body.pollId,
      slackUserId: body.slackUserId,
      optionIndex: body.optionIndex,
    });
  }

  return c.json({ ok: true });
});

app.post("/polls/mock-install", async (c) => {
  const db = await getPgliteDb();
  const teamId = `T_LOCAL_${Date.now()}`;
  const [workspace] = await db
    .insert(workspaces)
    .values({
      slackTeamId: teamId,
      slackTeamName: "Local Dev Workspace",
      botToken: "xoxb-local-mock",
      plan: "free",
      showBadge: true,
    })
    .returning();
  return c.json({ ok: true, workspace });
});

app.post("/polls", async (c) => {
  const body = await c.req.json<{
    question: string;
    options: string[];
    channelId?: string;
    createdBy?: string;
  }>();

  if (!body.question?.trim() || !Array.isArray(body.options) || body.options.length < 2) {
    return c.json({ error: "question and at least 2 options required" }, 400);
  }

  const db = await getPgliteDb();
  let [workspace] = await db.select().from(workspaces).limit(1);

  if (!workspace) {
    [workspace] = await db
      .insert(workspaces)
      .values({
        slackTeamId: "T_LOCAL_DEFAULT",
        slackTeamName: "Local Dev Workspace",
        botToken: "xoxb-local-mock",
        plan: "free",
        showBadge: true,
      })
      .returning();
  }

  const [poll] = await db
    .insert(polls)
    .values({
      workspaceId: workspace!.id,
      channelId: body.channelId ?? "C_LOCAL_DEV",
      question: body.question.trim(),
      options: body.options.map((o) => o.trim()).filter(Boolean),
      createdBy: body.createdBy ?? "local-dev",
      isAnonymous: false,
    })
    .returning();

  return c.json({ ok: true, poll });
});

app.get("/proof/collections", async (c) => {
  const db = await getPgliteDb();
  const rows = await db.select().from(collections);
  return c.json(rows);
});

app.get("/proof/collections/:slug", async (c) => {
  const db = await getPgliteDb();
  const slug = c.req.param("slug").replace(/\.js$/, "");
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.slug, slug))
    .limit(1);

  if (!collection) {
    return c.json({ error: "Not found" }, 404);
  }

  const items = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.collectionId, collection.id));

  return c.json({ collection, testimonials: items.filter((t) => t.isApproved) });
});

app.get("/proof/dashboard/collections/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [collection] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!collection) return c.json({ error: "Not found" }, 404);

  const items = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.collectionId, collection.id));

  return c.json({ collection, testimonials: items });
});

app.post("/proof/collections", async (c) => {
  const db = await getPgliteDb();
  const body = (await c.req.json()) as { name?: string; slug?: string; ownerId?: string };
  if (!body.name?.trim()) return c.json({ error: "Name required" }, 400);

  const slug =
    body.slug?.trim() ||
    body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

  const [row] = await db
    .insert(collections)
    .values({
      name: body.name.trim(),
      slug,
      ownerId: body.ownerId ?? "local-dev",
      plan: "free",
      showBadge: true,
    })
    .returning();

  return c.json(row);
});

app.patch("/proof/collections/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const body = (await c.req.json()) as { showBadge?: boolean; name?: string };

  const [existing] = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const [row] = await db
    .update(collections)
    .set({
      ...(body.showBadge !== undefined ? { showBadge: body.showBadge } : {}),
      ...(body.name ? { name: body.name.trim() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(collections.id, id))
    .returning();

  return c.json(row);
});

app.post("/proof/testimonials", async (c) => {
  const db = await getPgliteDb();
  const body = (await c.req.json()) as {
    collectionId?: string;
    slug?: string;
    authorName?: string;
    authorTitle?: string;
    content?: string;
    rating?: number;
  };

  if (!body.authorName?.trim() || !body.content?.trim()) {
    return c.json({ error: "Name and content required" }, 400);
  }

  let collectionId = body.collectionId;
  if (!collectionId && body.slug) {
    const [collection] = await db
      .select()
      .from(collections)
      .where(eq(collections.slug, body.slug))
      .limit(1);
    collectionId = collection?.id;
  }
  if (!collectionId) return c.json({ error: "Collection not found" }, 404);

  const [row] = await db
    .insert(testimonials)
    .values({
      collectionId,
      authorName: body.authorName.trim(),
      authorTitle: body.authorTitle?.trim() || null,
      content: body.content.trim(),
      rating: body.rating ?? null,
      isApproved: false,
      isFeatured: false,
    })
    .returning();

  return c.json(row, 201);
});

app.patch("/proof/testimonials/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const body = (await c.req.json()) as {
    isApproved?: boolean;
    isFeatured?: boolean;
  };

  const [existing] = await db.select().from(testimonials).where(eq(testimonials.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const [row] = await db
    .update(testimonials)
    .set({
      ...(body.isApproved !== undefined ? { isApproved: body.isApproved } : {}),
      ...(body.isFeatured !== undefined ? { isFeatured: body.isFeatured } : {}),
    })
    .where(eq(testimonials.id, id))
    .returning();

  return c.json(row);
});

app.get("/proof/kpi-events", async (c) => {
  const db = await getPgliteDb();
  const product = c.req.query("product") ?? "standard-proof";
  const rows = await db.select().from(kpiEvents).where(eq(kpiEvents.product, product));
  return c.json(rows);
});

app.get("/metrics/dashboard", async (c) => {
  const db = await getPgliteDb();
  const [account] = await db.select().from(stripeAccounts).limit(1);

  if (!account) {
    return c.json({ metrics: null, account: null });
  }

  const [latest] = await db
    .select()
    .from(metricSnapshots)
    .where(eq(metricSnapshots.stripeAccountId, account.id))
    .orderBy(desc(metricSnapshots.snapshotDate))
    .limit(1);

  return c.json({
    account,
    metrics: latest
      ? {
          mrr: Number(latest.mrr),
          arr: Number(latest.arr),
          churnRate: Number(latest.churnRate ?? 0) * 100,
          ltv: Number(latest.ltv ?? 0),
          activeSubscriptions: latest.activeSubscriptions,
          snapshotDate: latest.snapshotDate,
        }
      : null,
  });
});

app.get("/metrics/snapshots", async (c) => {
  const db = await getPgliteDb();
  const [account] = await db.select().from(stripeAccounts).limit(1);

  if (!account) {
    return c.json({ account: null, snapshots: [] });
  }

  const rows = await db
    .select()
    .from(metricSnapshots)
    .where(eq(metricSnapshots.stripeAccountId, account.id))
    .orderBy(desc(metricSnapshots.snapshotDate))
    .limit(30);

  return c.json({
    account,
    snapshots: rows.map((s) => ({
      id: s.id,
      snapshotDate: s.snapshotDate,
      mrr: Number(s.mrr),
      arr: Number(s.arr),
      churnRate: Number(s.churnRate ?? 0),
      ltv: Number(s.ltv ?? 0),
      activeSubscriptions: s.activeSubscriptions,
      breakdown: s.breakdown,
    })),
  });
});

app.get("/metrics/payment-links", async (c) => {
  const db = await getPgliteDb();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) return c.json({ links: [] });
  const links = await db
    .select()
    .from(paymentLinks)
    .where(eq(paymentLinks.stripeAccountId, account.id))
    .orderBy(desc(paymentLinks.createdAt));
  return c.json({ links });
});

app.post("/metrics/payment-links", async (c) => {
  const body = await c.req.json<{ name?: string; url?: string }>();
  const db = await getPgliteDb();
  let [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    [account] = await db
      .insert(stripeAccounts)
      .values({
        stripeAccountId: "acct_demo_local",
        ownerId: "local-dev",
        accessToken: "sk_demo_local",
        plan: "free",
      })
      .returning();
  }
  const [link] = await db
    .insert(paymentLinks)
    .values({
      stripeAccountId: account!.id,
      stripeLinkId: `plink_${Date.now()}`,
      name: body.name ?? "Untitled",
      url: body.url ?? "",
      active: true,
      updatedAt: new Date(),
    })
    .returning();
  return c.json({ link });
});

app.patch("/metrics/payment-links/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; url?: string; active?: boolean }>();
  const db = await getPgliteDb();
  const [link] = await db
    .update(paymentLinks)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.url !== undefined ? { url: body.url } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(paymentLinks.id, id))
    .returning();
  if (!link) return c.json({ error: "Not found" }, 404);
  return c.json({ link });
});

app.delete("/metrics/payment-links/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(paymentLinks).where(eq(paymentLinks.id, id));
  return c.json({ ok: true });
});

const PERIOD_DAYS: Record<string, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  ytd: 365,
};

app.get("/metrics/analytics", async (c) => {
  const period = (c.req.query("period") ?? "30d") as keyof typeof PERIOD_DAYS;
  const days = PERIOD_DAYS[period] ?? 30;
  const db = await getPgliteDb();
  const [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    return c.json({ account: null, current: [], previous: [], deltas: null, breakdown: [] });
  }

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

  return c.json({
    account,
    period,
    current: currentRows.map((s) => ({
      id: s.id,
      snapshotDate: s.snapshotDate,
      mrr: Number(s.mrr),
      arr: Number(s.arr),
      churnRate: Number(s.churnRate ?? 0),
      ltv: Number(s.ltv ?? 0),
      activeSubscriptions: s.activeSubscriptions,
      breakdown: s.breakdown,
    })),
    previous: previousRows.map((s) => ({
      id: s.id,
      snapshotDate: s.snapshotDate,
      mrr: Number(s.mrr),
      arr: Number(s.arr),
      churnRate: Number(s.churnRate ?? 0),
      ltv: Number(s.ltv ?? 0),
      activeSubscriptions: s.activeSubscriptions,
    })),
    deltas,
    breakdown,
  });
});

app.get("/metrics/quota", async (c) => {
  const sourceFilter = c.req.query("source");
  const db = await getPgliteDb();
  const [account] = await db.select().from(stripeAccounts).limit(1);

  const conds = [];
  if (account) conds.push(eq(quotaSamples.stripeAccountId, account.id));
  if (sourceFilter) conds.push(eq(quotaSamples.source, sourceFilter));

  const rows = await db
    .select()
    .from(quotaSamples)
    .where(conds.length === 2 ? and(...conds) : conds[0])
    .orderBy(desc(quotaSamples.sampledAt))
    .limit(100);

  const bySource = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = bySource.get(r.source) ?? [];
    list.push(r);
    bySource.set(r.source, list);
  }
  const latest = Array.from(bySource.entries()).map(([source, list]) => ({ source, samples: list }));
  return c.json({ account, latest });
});

app.post("/metrics/quota", async (c) => {
  const body = (await c.req.json()) as {
    source?: string;
    quotaLabel?: string;
    used?: number;
    limit?: number | null;
    windowStartedAt?: string;
    windowEndsAt?: string | null;
    metadata?: Record<string, unknown>;
  };
  if (!body.source || !body.quotaLabel) {
    return c.json({ error: "source and quotaLabel are required" }, 400);
  }
  const db = await getPgliteDb();
  let [account] = await db.select().from(stripeAccounts).limit(1);
  if (!account) {
    [account] = await db
      .insert(stripeAccounts)
      .values({
        stripeAccountId: "acct_demo_local",
        ownerId: "local-dev",
        accessToken: "sk_demo_local",
        plan: "free",
      })
      .returning();
  }
  const [row] = await db
    .insert(quotaSamples)
    .values({
      stripeAccountId: account!.id,
      source: body.source,
      quotaLabel: body.quotaLabel,
      used: body.used ?? 0,
      limit: body.limit ?? null,
      windowStartedAt: body.windowStartedAt ? new Date(body.windowStartedAt) : new Date(),
      windowEndsAt: body.windowEndsAt ? new Date(body.windowEndsAt) : null,
      metadata: body.metadata ?? {},
    })
    .returning();
  return c.json({ sample: row }, 201);
});

app.get("/hook/inboxes", async (c) => {
  const db = await getPgliteDb();
  const rows = await db.select().from(webhookInboxes).orderBy(desc(webhookInboxes.createdAt));
  return c.json(rows);
});

app.get("/billing/customer", async (c) => {
  const product = c.req.query("product");
  const userId = c.req.query("userId");
  if (!product || !userId) return c.json({ customer: null });
  const db = await getPgliteDb();
  const [row] = await db
    .select()
    .from(billingCustomers)
    .where(and(eq(billingCustomers.product, product), eq(billingCustomers.externalUserId, userId)))
    .limit(1);
  if (!row) return c.json({ customer: null });
  return c.json({
    customer: {
      product: row.product,
      externalUserId: row.externalUserId,
      stripeCustomerId: row.stripeCustomerId,
      stripeSubscriptionId: row.stripeSubscriptionId ?? null,
      plan: row.plan,
      showBadge: row.showBadge,
    },
  });
});

app.get("/hook/inboxes/slug/:slug", async (c) => {
  const db = await getPgliteDb();
  const slug = c.req.param("slug");
  const [inbox] = await db.select().from(webhookInboxes).where(eq(webhookInboxes.slug, slug)).limit(1);
  if (!inbox) return c.json({ error: "Not found" }, 404);
  return c.json(inbox);
});

app.get("/hook/inboxes/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [inbox] = await db.select().from(webhookInboxes).where(eq(webhookInboxes.id, id)).limit(1);
  if (!inbox) return c.json({ error: "Not found" }, 404);

  const events = await db
    .select()
    .from(webhookEvents)
    .where(eq(webhookEvents.inboxId, inbox.id))
    .orderBy(desc(webhookEvents.receivedAt));

  return c.json({ inbox, events });
});

app.post("/hook/inboxes", async (c) => {
  const db = await getPgliteDb();
  const body = (await c.req.json()) as { name?: string; slug?: string; ownerId?: string };
  if (!body.name?.trim()) return c.json({ error: "Name required" }, 400);

  const slug =
    body.slug?.trim() ||
    body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);

  const [row] = await db
    .insert(webhookInboxes)
    .values({
      name: body.name.trim(),
      slug,
      ownerId: body.ownerId ?? "local-dev",
    })
    .returning();

  return c.json(row, 201);
});

app.post("/hook/capture/:slug", async (c) => {
  const db = await getPgliteDb();
  const slug = c.req.param("slug");
  const [inbox] = await db.select().from(webhookInboxes).where(eq(webhookInboxes.slug, slug)).limit(1);
  if (!inbox) return c.json({ error: "Not found" }, 404);

  const body = (await c.req.json()) as {
    method?: string;
    headers?: Record<string, string>;
    body?: string | null;
    queryParams?: Record<string, string>;
  };

  const [row] = await db
    .insert(webhookEvents)
    .values({
      inboxId: inbox.id,
      method: body.method ?? "POST",
      headers: body.headers ?? {},
      body: body.body ?? null,
      queryParams: body.queryParams ?? {},
    })
    .returning();

  return c.json(row, 201);
});

app.get("/hook/events/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [row] = await db.select().from(webhookEvents).where(eq(webhookEvents.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

app.get("/release/repos", async (c) => {
  const db = await getPgliteDb();
  const rows = await db.select().from(releaseRepos).orderBy(desc(releaseRepos.createdAt));
  return c.json(rows);
});

app.get("/release/repos/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [row] = await db.select().from(releaseRepos).where(eq(releaseRepos.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

app.post("/release/repos", async (c) => {
  const db = await getPgliteDb();
  const body = (await c.req.json()) as {
    repoFullName?: string;
    defaultBranch?: string;
    ownerId?: string;
  };
  if (!body.repoFullName?.trim()) return c.json({ error: "repoFullName required" }, 400);

  const [row] = await db
    .insert(releaseRepos)
    .values({
      ownerId: body.ownerId ?? "local-dev",
      repoFullName: body.repoFullName.trim(),
      defaultBranch: body.defaultBranch?.trim() || "main",
    })
    .returning();

  return c.json(row, 201);
});

app.get("/release/notes", async (c) => {
  const db = await getPgliteDb();
  const repos = await db.select().from(releaseRepos);
  const results: Array<typeof releaseNotes.$inferSelect & { repoFullName: string }> = [];

  for (const repo of repos) {
    const notes = await db
      .select()
      .from(releaseNotes)
      .where(eq(releaseNotes.repoId, repo.id))
      .orderBy(desc(releaseNotes.createdAt));
    for (const note of notes) {
      results.push({ ...note, repoFullName: repo.repoFullName });
    }
  }

  return c.json(results);
});

app.get("/release/notes/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [note] = await db.select().from(releaseNotes).where(eq(releaseNotes.id, id)).limit(1);
  if (!note) return c.json({ error: "Not found" }, 404);

  const [repo] = await db.select().from(releaseRepos).where(eq(releaseRepos.id, note.repoId)).limit(1);
  if (!repo) return c.json({ error: "Not found" }, 404);

  return c.json({ note, repo });
});

app.post("/release/notes", async (c) => {
  const db = await getPgliteDb();
  const body = (await c.req.json()) as {
    repoId?: string;
    version?: string;
    title?: string;
    bodyMd?: string;
  };
  if (!body.repoId || !body.version || !body.bodyMd) {
    return c.json({ error: "repoId, version, and bodyMd required" }, 400);
  }

  const [row] = await db
    .insert(releaseNotes)
    .values({
      repoId: body.repoId,
      version: body.version,
      title: body.title ?? null,
      bodyMd: body.bodyMd,
    })
    .returning();

  return c.json(row, 201);
});

app.patch("/release/notes/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const body = (await c.req.json()) as {
    bodyMd?: string;
    title?: string;
    publish?: boolean;
  };

  const [existing] = await db.select().from(releaseNotes).where(eq(releaseNotes.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);

  const [row] = await db
    .update(releaseNotes)
    .set({
      ...(body.bodyMd !== undefined ? { bodyMd: body.bodyMd } : {}),
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.publish ? { publishedAt: new Date() } : {}),
    })
    .where(eq(releaseNotes.id, id))
    .returning();

  return c.json(row);
});

app.get("/links/links", async (c) => {
  const ownerId = c.req.query("ownerId");
  const db = await getPgliteDb();
  const rows = ownerId
    ? await db
        .select()
        .from(linkRecords)
        .where(eq(linkRecords.ownerId, ownerId))
        .orderBy(desc(linkRecords.createdAt))
    : await db.select().from(linkRecords).orderBy(desc(linkRecords.createdAt));
  return c.json(rows);
});

app.get("/links/links/slug/:slug", async (c) => {
  const db = await getPgliteDb();
  const slug = c.req.param("slug");
  const [row] = await db.select().from(linkRecords).where(eq(linkRecords.slug, slug)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

app.get("/links/links/:id", async (c) => {
  const db = await getPgliteDb();
  const id = c.req.param("id");
  const [row] = await db.select().from(linkRecords).where(eq(linkRecords.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);

  const events = await db
    .select()
    .from(linkClickEvents)
    .where(eq(linkClickEvents.linkId, row.id))
    .orderBy(desc(linkClickEvents.clickedAt))
    .limit(50);

  return c.json({ link: row, events });
});

app.post("/links/links", async (c) => {
  const body = (await c.req.json()) as {
    ownerId?: string;
    name?: string;
    slug?: string;
    stripeUrl?: string;
    stripeLinkId?: string;
    metadata?: Record<string, unknown>;
  };
  if (!body.ownerId || !body.name || !body.stripeUrl) {
    return c.json({ error: "ownerId, name, stripeUrl required" }, 400);
  }
  const slug =
    body.slug?.trim() ||
    body.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) ||
    `link-${Date.now()}`;

  const db = await getPgliteDb();
  try {
    const [row] = await db
      .insert(linkRecords)
      .values({
        ownerId: body.ownerId,
        slug,
        name: body.name.trim(),
        stripeUrl: body.stripeUrl.trim(),
        stripeLinkId: body.stripeLinkId?.trim() || null,
        metadata: body.metadata ?? {},
        updatedAt: new Date(),
      })
      .returning();
    return c.json(row, 201);
  } catch (err) {
    return c.json({ error: "Slug already in use", detail: String(err) }, 409);
  }
});

app.patch("/links/links/:id", async (c) => {
  const id = c.req.param("id");
  const body = (await c.req.json()) as {
    name?: string;
    stripeUrl?: string;
    stripeLinkId?: string;
    active?: boolean;
    metadata?: Record<string, unknown>;
  };
  const db = await getPgliteDb();
  const [row] = await db
    .update(linkRecords)
    .set({
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.stripeUrl !== undefined ? { stripeUrl: body.stripeUrl } : {}),
      ...(body.stripeLinkId !== undefined ? { stripeLinkId: body.stripeLinkId } : {}),
      ...(body.active !== undefined ? { active: body.active } : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata } : {}),
      updatedAt: new Date(),
    })
    .where(eq(linkRecords.id, id))
    .returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json(row);
});

app.delete("/links/links/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(linkRecords).where(eq(linkRecords.id, id));
  return c.json({ ok: true });
});

app.post("/links/click/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = await getPgliteDb();
  const [row] = await db.select().from(linkRecords).where(eq(linkRecords.slug, slug)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  if (!row.active) return c.json({ error: "Inactive" }, 410);

  const body = (await c.req.json().catch(() => ({}))) as {
    ipHash?: string;
    userAgent?: string;
    referrer?: string;
    utm?: Record<string, string>;
  };

  await db
    .update(linkRecords)
    .set({ clickCount: row.clickCount + 1, lastClickedAt: new Date() })
    .where(eq(linkRecords.id, row.id));

  await db.insert(linkClickEvents).values({
    linkId: row.id,
    ipHash: body.ipHash ?? null,
    userAgent: body.userAgent ?? null,
    referrer: body.referrer ?? null,
    utm: body.utm ?? {},
  });

  return c.json({ ok: true, stripeUrl: row.stripeUrl });
});

// ----- Vault (encrypted secrets) -----

app.get("/vault/projects", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(vaultProjects)
    .where(eq(vaultProjects.ownerId, ownerId))
    .orderBy(desc(vaultProjects.createdAt));
  return c.json({ projects: rows });
});

app.post("/vault/projects", async (c) => {
  const body = await c.req.json<{ ownerId?: string; name?: string; environment?: string; githubRepo?: string; description?: string }>();
  if (!body.ownerId || !body.name) return c.json({ error: "ownerId and name required" }, 400);
  const db = await getPgliteDb();
  const [row] = await db
    .insert(vaultProjects)
    .values({
      ownerId: body.ownerId,
      name: body.name,
      environment: body.environment ?? "production",
      githubRepo: body.githubRepo ?? null,
      description: body.description ?? null,
    })
    .returning();
  return c.json({ project: row }, 201);
});

app.patch("/vault/projects/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; environment?: string; githubRepo?: string; description?: string }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.environment !== undefined) updates.environment = body.environment;
  if (body.githubRepo !== undefined) updates.githubRepo = body.githubRepo;
  if (body.description !== undefined) updates.description = body.description;
  const [row] = await db.update(vaultProjects).set(updates).where(eq(vaultProjects.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ project: row });
});

app.delete("/vault/projects/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(vaultProjects).where(eq(vaultProjects.id, id));
  return c.json({ ok: true });
});

app.get("/vault/projects/:id/secrets", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select({
      id: vaultSecrets.id,
      projectId: vaultSecrets.projectId,
      key: vaultSecrets.key,
      valueHash: vaultSecrets.valueHash,
      version: vaultSecrets.version,
      agentReference: vaultSecrets.agentReference,
      notes: vaultSecrets.notes,
      lastRotatedAt: vaultSecrets.lastRotatedAt,
      createdAt: vaultSecrets.createdAt,
      updatedAt: vaultSecrets.updatedAt,
    })
    .from(vaultSecrets)
    .where(eq(vaultSecrets.projectId, id))
    .orderBy(vaultSecrets.key);
  return c.json({ secrets: rows });
});

app.post("/vault/projects/:id/secrets", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ key?: string; value?: string; agentReference?: boolean; notes?: string }>();
  if (!body.key || typeof body.value !== "string") return c.json({ error: "key and value required" }, 400);
  const db = await getPgliteDb();
  const enc = encryptSecret(body.value);
  const [row] = await db
    .insert(vaultSecrets)
    .values({
      projectId: id,
      key: body.key,
      ciphertext: enc.ciphertext,
      nonce: enc.nonce,
      valueHash: enc.valueHash,
      agentReference: body.agentReference ?? false,
      notes: body.notes ?? null,
    })
    .returning();
  await db.insert(vaultAuditLog).values({
    projectId: id,
    secretId: row?.id,
    action: "create",
    actor: "owner",
    metadata: { key: body.key },
  });
  return c.json({
    secret: {
      id: row?.id,
      projectId: row?.projectId,
      key: row?.key,
      valueHash: row?.valueHash,
      version: row?.version,
      agentReference: row?.agentReference,
      notes: row?.notes,
      lastRotatedAt: row?.lastRotatedAt,
      createdAt: row?.createdAt,
      updatedAt: row?.updatedAt,
    },
  }, 201);
});

app.patch("/vault/secrets/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ value?: string; agentReference?: boolean; notes?: string }>();
  const db = await getPgliteDb();
  const [existing] = await db.select().from(vaultSecrets).where(eq(vaultSecrets.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.value !== undefined) {
    const enc = encryptSecret(body.value);
    updates.ciphertext = enc.ciphertext;
    updates.nonce = enc.nonce;
    updates.valueHash = enc.valueHash;
    updates.version = (existing.version ?? 1) + 1;
    updates.lastRotatedAt = new Date();
  }
  if (body.agentReference !== undefined) updates.agentReference = body.agentReference;
  if (body.notes !== undefined) updates.notes = body.notes;
  const [row] = await db.update(vaultSecrets).set(updates).where(eq(vaultSecrets.id, id)).returning();
  await db.insert(vaultAuditLog).values({
    projectId: existing.projectId,
    secretId: id,
    action: body.value !== undefined ? "rotate" : "update",
    actor: "owner",
    metadata: { key: existing.key, version: row?.version },
  });
  return c.json({ secret: { id: row?.id, projectId: row?.projectId, key: row?.key, valueHash: row?.valueHash, version: row?.version, agentReference: row?.agentReference, notes: row?.notes, lastRotatedAt: row?.lastRotatedAt, createdAt: row?.createdAt, updatedAt: row?.updatedAt } });
});

app.delete("/vault/secrets/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const [existing] = await db.select().from(vaultSecrets).where(eq(vaultSecrets.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  await db.delete(vaultSecrets).where(eq(vaultSecrets.id, id));
  await db.insert(vaultAuditLog).values({
    projectId: existing.projectId,
    secretId: id,
    action: "delete",
    actor: "owner",
    metadata: { key: existing.key },
  });
  return c.json({ ok: true });
});

/** Decrypt endpoint — used by the env-injection CLI shim. Auth via token hash. */
app.post("/vault/projects/:id/decrypt", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ token?: string }>();
  if (!body.token) return c.json({ error: "token required" }, 401);
  const db = await getPgliteDb();
  const hash = hashToken(body.token);
  const [tok] = await db.select().from(vaultTokens).where(eq(vaultTokens.tokenHash, hash)).limit(1);
  if (!tok || tok.projectId !== id) return c.json({ error: "invalid token" }, 401);
  if (tok.expiresAt && new Date(tok.expiresAt) < new Date()) return c.json({ error: "token expired" }, 401);
  await db.update(vaultTokens).set({ lastUsedAt: new Date() }).where(eq(vaultTokens.id, tok.id));
  const rows = await db.select().from(vaultSecrets).where(eq(vaultSecrets.projectId, id));
  const plaintext: Record<string, string> = {};
  for (const r of rows) {
    plaintext[r.key] = decryptSecret(r.ciphertext, r.nonce);
  }
  await db.insert(vaultAuditLog).values({
    projectId: id,
    action: "decrypt",
    actor: `token:${tok.last4}`,
    metadata: { count: rows.length },
  });
  return c.json({ secrets: plaintext });
});

/** Owner-authorized dotenv export — decrypts all secrets for a project (no token needed; app route checks ownership). */
app.get("/vault/projects/:id/dotenv", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select({ key: vaultSecrets.key, ciphertext: vaultSecrets.ciphertext, nonce: vaultSecrets.nonce })
    .from(vaultSecrets)
    .where(eq(vaultSecrets.projectId, id))
    .orderBy(vaultSecrets.key);
  const values: Record<string, string> = {};
  for (const r of rows) {
    values[r.key] = decryptSecret(r.ciphertext, r.nonce);
  }
  await db.insert(vaultAuditLog).values({
    projectId: id,
    action: "dotenv_export",
    actor: "owner",
    metadata: { count: rows.length },
  });
  return c.json({ values });
});

/** AI-agent reference mode — returns keys + versions without values, no token required. */
app.get("/vault/projects/:id/references", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select({ key: vaultSecrets.key, version: vaultSecrets.version, notes: vaultSecrets.notes, lastRotatedAt: vaultSecrets.lastRotatedAt })
    .from(vaultSecrets)
    .where(and(eq(vaultSecrets.projectId, id), eq(vaultSecrets.agentReference, true)));
  return c.json({ references: rows });
});

app.post("/vault/projects/:id/tokens", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; scopes?: string[]; expiresInDays?: number }>();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const db = await getPgliteDb();
  const { token, hash, last4 } = generateToken();
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  const [row] = await db
    .insert(vaultTokens)
    .values({
      projectId: id,
      name: body.name,
      tokenHash: hash,
      last4,
      scopes: body.scopes ?? ["read"],
      expiresAt,
    })
    .returning();
  await db.insert(vaultAuditLog).values({
    projectId: id,
    action: "token_create",
    actor: "owner",
    metadata: { name: body.name, last4 },
  });
  return c.json({ token, tokenMeta: { id: row?.id, name: row?.name, last4: row?.last4, scopes: row?.scopes, lastUsedAt: row?.lastUsedAt, expiresAt: row?.expiresAt, createdAt: row?.createdAt } }, 201);
});

app.get("/vault/projects/:id/tokens", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select({ id: vaultTokens.id, name: vaultTokens.name, last4: vaultTokens.last4, scopes: vaultTokens.scopes, lastUsedAt: vaultTokens.lastUsedAt, expiresAt: vaultTokens.expiresAt, createdAt: vaultTokens.createdAt })
    .from(vaultTokens)
    .where(eq(vaultTokens.projectId, id))
    .orderBy(desc(vaultTokens.createdAt));
  return c.json({ tokens: rows });
});

app.delete("/vault/tokens/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(vaultTokens).where(eq(vaultTokens.id, id));
  return c.json({ ok: true });
});

app.get("/vault/projects/:id/audit", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(vaultAuditLog)
    .where(eq(vaultAuditLog.projectId, id))
    .orderBy(desc(vaultAuditLog.createdAt))
    .limit(100);
  return c.json({ audit: rows });
});

// ----- Snippets (code snippet manager) -----

app.get("/snippets/snippets", async (c) => {
  const ownerId = c.req.query("ownerId");
  const tag = c.req.query("tag");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  let rows;
  if (tag) {
    rows = await db
      .select()
      .from(snippets)
      .where(and(eq(snippets.ownerId, ownerId), sql`${snippets.tags} @> ARRAY[${tag}]::text[]`))
      .orderBy(desc(snippets.updatedAt));
  } else {
    rows = await db
      .select()
      .from(snippets)
      .where(eq(snippets.ownerId, ownerId))
      .orderBy(desc(snippets.updatedAt));
  }
  return c.json({ snippets: rows });
});

app.post("/snippets/snippets", async (c) => {
  const body = await c.req.json<{ ownerId?: string; title?: string; language?: string; body?: string; tags?: string[] }>();
  if (!body.ownerId || !body.title) return c.json({ error: "ownerId and title required" }, 400);
  const db = await getPgliteDb();
  const [row] = await db
    .insert(snippets)
    .values({
      ownerId: body.ownerId,
      title: body.title,
      language: body.language ?? "plaintext",
      body: body.body ?? "",
      tags: body.tags ?? [],
    })
    .returning();
  // Create initial version
  if (row) {
    await db.insert(snippetVersions).values({
      snippetId: row.id,
      body: row.body,
      versionNote: "initial",
      createdBy: row.ownerId,
      versionNumber: 1,
    });
  }
  return c.json({ snippet: row }, 201);
});

app.get("/snippets/snippets/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const [row] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ snippet: row });
});

app.patch("/snippets/snippets/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string; language?: string; body?: string; tags?: string[]; versionNote?: string }>();
  const db = await getPgliteDb();
  const [existing] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.language !== undefined) updates.language = body.language;
  if (body.body !== undefined) updates.body = body.body;
  if (body.tags !== undefined) updates.tags = body.tags;
  const [row] = await db.update(snippets).set(updates).where(eq(snippets.id, id)).returning();
  // Auto-create a version row when body changes
  if (body.body !== undefined && row) {
    const [lastVer] = await db
      .select({ max: sql<number>`max(version_number)` })
      .from(snippetVersions)
      .where(eq(snippetVersions.snippetId, id));
    const nextVer = (Number(lastVer?.max ?? 0) || 0) + 1;
    await db.insert(snippetVersions).values({
      snippetId: id,
      body: body.body,
      versionNote: body.versionNote ?? null,
      createdBy: existing.ownerId,
      versionNumber: nextVer,
    });
  }
  return c.json({ snippet: row });
});

app.delete("/snippets/snippets/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(snippets).where(eq(snippets.id, id));
  return c.json({ ok: true });
});

app.get("/snippets/snippets/:id/versions", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(snippetVersions)
    .where(eq(snippetVersions.snippetId, id))
    .orderBy(desc(snippetVersions.versionNumber));
  return c.json({ versions: rows });
});

app.post("/snippets/snippets/:id/share", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ expiresInDays?: number }>();
  const db = await getPgliteDb();
  const [existing] = await db.select().from(snippets).where(eq(snippets.id, id)).limit(1);
  if (!existing) return c.json({ error: "Not found" }, 404);
  const slug = generateShareSlug();
  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
    : null;
  const [row] = await db
    .insert(snippetShares)
    .values({ snippetId: id, slug, expiresAt })
    .returning();
  return c.json({ share: row }, 201);
});

app.get("/snippets/shared/:slug", async (c) => {
  const slug = c.req.param("slug");
  const db = await getPgliteDb();
  const [share] = await db.select().from(snippetShares).where(eq(snippetShares.slug, slug)).limit(1);
  if (!share) return c.json({ error: "Not found" }, 404);
  if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
    return c.json({ error: "expired" }, 410);
  }
  const [snippet] = await db.select().from(snippets).where(eq(snippets.id, share.snippetId)).limit(1);
  if (!snippet) return c.json({ error: "Not found" }, 404);
  return c.json({ snippet, share });
});

app.get("/snippets/export/json", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db.select().from(snippets).where(eq(snippets.ownerId, ownerId));
  return c.json({ snippets: rows });
});

function generateShareSlug(): string {
  // 8-char base36 slug — unique-enough for sharing, can be regenerated
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ----- Status (build/CI dashboard) -----

app.get("/status/pipelines", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(pipelines)
    .where(eq(pipelines.ownerId, ownerId))
    .orderBy(desc(pipelines.updatedAt));
  return c.json({ pipelines: rows });
});

app.post("/status/pipelines", async (c) => {
  const body = await c.req.json<{ ownerId?: string; source?: string; name?: string; repoFullName?: string }>();
  if (!body.ownerId || !body.source || !body.name) {
    return c.json({ error: "ownerId, source, name required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(pipelines)
    .values({
      ownerId: body.ownerId,
      source: body.source,
      name: body.name,
      repoFullName: body.repoFullName ?? null,
    })
    .returning();
  return c.json({ pipeline: row }, 201);
});

app.get("/status/pipelines/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const [row] = await db.select().from(pipelines).where(eq(pipelines.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  const deploys = await db
    .select()
    .from(deployments)
    .where(eq(deployments.pipelineId, id))
    .orderBy(desc(deployments.deployedAt))
    .limit(30);
  return c.json({ pipeline: row, deployments: deploys });
});

app.patch("/status/pipelines/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ lastRunAt?: string; lastStatus?: string; last30Runs?: Array<{ status: string; at: string }>; metadata?: Record<string, unknown> }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.lastRunAt !== undefined) updates.lastRunAt = new Date(body.lastRunAt);
  if (body.lastStatus !== undefined) updates.lastStatus = body.lastStatus;
  if (body.last30Runs !== undefined) updates.last30Runs = body.last30Runs;
  if (body.metadata !== undefined) updates.metadata = body.metadata;
  const [row] = await db.update(pipelines).set(updates).where(eq(pipelines.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ pipeline: row });
});

app.delete("/status/pipelines/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(pipelines).where(eq(pipelines.id, id));
  return c.json({ ok: true });
});

app.post("/status/pipelines/:id/deployments", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ environment?: string; sha?: string; status?: string; url?: string; metadata?: Record<string, unknown> }>();
  if (!body.environment || !body.status) {
    return c.json({ error: "environment and status required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(deployments)
    .values({
      pipelineId: id,
      environment: body.environment,
      sha: body.sha ?? null,
      status: body.status,
      url: body.url ?? null,
      metadata: body.metadata ?? null,
    })
    .returning();
  return c.json({ deployment: row }, 201);
});

app.get("/status/incidents", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(incidents)
    .where(eq(incidents.ownerId, ownerId))
    .orderBy(desc(incidents.startedAt));
  return c.json({ incidents: rows });
});

app.post("/status/incidents", async (c) => {
  const body = await c.req.json<{ ownerId?: string; title?: string; severity?: string; sourcePipelineId?: string; summary?: string }>();
  if (!body.ownerId || !body.title) {
    return c.json({ error: "ownerId and title required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(incidents)
    .values({
      ownerId: body.ownerId,
      title: body.title,
      severity: body.severity ?? "sev3",
      sourcePipelineId: body.sourcePipelineId ?? null,
      summary: body.summary ?? null,
    })
    .returning();
  return c.json({ incident: row }, 201);
});

app.patch("/status/incidents/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ status?: string; resolvedAt?: string; summary?: string; severity?: string }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.status !== undefined) updates.status = body.status;
  if (body.severity !== undefined) updates.severity = body.severity;
  if (body.summary !== undefined) updates.summary = body.summary;
  if (body.resolvedAt !== undefined) {
    updates.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
  } else if (body.status === "resolved") {
    updates.resolvedAt = new Date();
  }
  const [row] = await db.update(incidents).set(updates).where(eq(incidents.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ incident: row });
});

app.delete("/status/incidents/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(incidents).where(eq(incidents.id, id));
  return c.json({ ok: true });
});

// ----- Regex (pattern builder + debugger) -----

app.get("/regex/patterns", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(patterns)
    .where(eq(patterns.ownerId, ownerId))
    .orderBy(desc(patterns.updatedAt));
  return c.json({ patterns: rows });
});

app.get("/regex/patterns/public", async (c) => {
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(patterns)
    .where(eq(patterns.isPublic, true))
    .orderBy(desc(patterns.updatedAt))
    .limit(50);
  return c.json({ patterns: rows });
});

app.post("/regex/patterns", async (c) => {
  const body = await c.req.json<{ ownerId?: string; name?: string; pattern?: string; flags?: string; description?: string; testCases?: unknown; tags?: string[]; isPublic?: boolean }>();
  if (!body.ownerId || !body.name || !body.pattern) {
    return c.json({ error: "ownerId, name, pattern required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(patterns)
    .values({
      ownerId: body.ownerId,
      name: body.name,
      pattern: body.pattern,
      flags: body.flags ?? "g",
      description: body.description ?? null,
      testCases: (body.testCases as TestCase[]) ?? [],
      tags: body.tags ?? [],
      isPublic: body.isPublic ?? false,
    })
    .returning();
  return c.json({ pattern: row }, 201);
});

app.get("/regex/patterns/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const [row] = await db.select().from(patterns).where(eq(patterns.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  const forks = await db.select().from(patternForks).where(eq(patternForks.patternId, id));
  return c.json({ pattern: row, forks });
});

app.patch("/regex/patterns/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; pattern?: string; flags?: string; description?: string; testCases?: unknown; tags?: string[]; isPublic?: boolean }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.pattern !== undefined) updates.pattern = body.pattern;
  if (body.flags !== undefined) updates.flags = body.flags;
  if (body.description !== undefined) updates.description = body.description;
  if (body.testCases !== undefined) updates.testCases = body.testCases;
  if (body.tags !== undefined) updates.tags = body.tags;
  if (body.isPublic !== undefined) updates.isPublic = body.isPublic;
  const [row] = await db.update(patterns).set(updates).where(eq(patterns.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ pattern: row });
});

app.delete("/regex/patterns/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(patterns).where(eq(patterns.id, id));
  return c.json({ ok: true });
});

app.post("/regex/patterns/:id/forks", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ ownerId?: string; pattern?: string; flags?: string }>();
  if (!body.ownerId || !body.pattern) {
    return c.json({ error: "ownerId and pattern required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(patternForks)
    .values({
      patternId: id,
      ownerId: body.ownerId,
      pattern: body.pattern,
      flags: body.flags ?? "g",
    })
    .returning();
  return c.json({ fork: row }, 201);
});

// ----- Postmortem (blameless incident postmortem + recurrence) -----

app.get("/postmortem/incidents", async (c) => {
  const ownerId = c.req.query("ownerId");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(pmIncidents)
    .where(eq(pmIncidents.ownerId, ownerId))
    .orderBy(desc(pmIncidents.startedAt));
  return c.json({ incidents: rows });
});

app.post("/postmortem/incidents", async (c) => {
  const body = await c.req.json<{
    ownerId?: string;
    title?: string;
    severity?: string;
    startedAt?: string;
    resolvedAt?: string;
    summary?: string;
    rootcauseMd?: string;
    timeline?: TimelineEntry[];
    sections?: PostmortemSections;
    status?: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }>();
  if (!body.ownerId || !body.title) {
    return c.json({ error: "ownerId and title required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(pmIncidents)
    .values({
      ownerId: body.ownerId,
      title: body.title,
      severity: body.severity ?? "sev3",
      startedAt: body.startedAt ? new Date(body.startedAt) : new Date(),
      resolvedAt: body.resolvedAt ? new Date(body.resolvedAt) : null,
      summary: body.summary ?? null,
      rootcauseMd: body.rootcauseMd ?? null,
      timeline: body.timeline ?? [],
      sections: body.sections ?? { whatWentWell: "", whatDidnt: "", whereWeGotLucky: "" },
      status: body.status ?? "draft",
      source: body.source ?? null,
      metadata: body.metadata ?? null,
    })
    .returning();
  return c.json({ incident: row }, 201);
});

app.get("/postmortem/incidents/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  const [row] = await db.select().from(pmIncidents).where(eq(pmIncidents.id, id)).limit(1);
  if (!row) return c.json({ error: "Not found" }, 404);
  const [actions, linksFrom, linksTo] = await Promise.all([
    db.select().from(pmActionItems).where(eq(pmActionItems.incidentId, id)),
    db.select().from(pmRecurrenceLinks).where(eq(pmRecurrenceLinks.fromIncidentId, id)),
    db.select().from(pmRecurrenceLinks).where(eq(pmRecurrenceLinks.toIncidentId, id)),
  ]);
  return c.json({ incident: row, actionItems: actions, recurrenceLinks: [...linksFrom, ...linksTo] });
});

app.patch("/postmortem/incidents/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    title?: string;
    severity?: string;
    startedAt?: string;
    resolvedAt?: string;
    summary?: string | null;
    rootcauseMd?: string | null;
    timeline?: TimelineEntry[];
    sections?: PostmortemSections;
    status?: string;
    metadata?: Record<string, unknown>;
  }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.severity !== undefined) updates.severity = body.severity;
  if (body.startedAt !== undefined) updates.startedAt = new Date(body.startedAt);
  if (body.resolvedAt !== undefined) updates.resolvedAt = body.resolvedAt ? new Date(body.resolvedAt) : null;
  if (body.summary !== undefined) updates.summary = body.summary;
  if (body.rootcauseMd !== undefined) updates.rootcauseMd = body.rootcauseMd;
  if (body.timeline !== undefined) updates.timeline = body.timeline;
  if (body.sections !== undefined) updates.sections = body.sections;
  if (body.status !== undefined) {
    updates.status = body.status;
    if (body.status === "resolved" && !body.resolvedAt) {
      updates.resolvedAt = new Date();
    }
  }
  if (body.metadata !== undefined) updates.metadata = body.metadata;
  const [row] = await db.update(pmIncidents).set(updates).where(eq(pmIncidents.id, id)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ incident: row });
});

app.delete("/postmortem/incidents/:id", async (c) => {
  const id = c.req.param("id");
  const db = await getPgliteDb();
  await db.delete(pmIncidents).where(eq(pmIncidents.id, id));
  return c.json({ ok: true });
});

app.post("/postmortem/incidents/:id/actions", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ ownerId?: string; body?: string; dueAt?: string }>();
  if (!body.ownerId || !body.body) {
    return c.json({ error: "ownerId and body required" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(pmActionItems)
    .values({
      incidentId: id,
      ownerId: body.ownerId,
      body: body.body,
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    .returning();
  return c.json({ actionItem: row }, 201);
});

app.patch("/postmortem/actions/:actionId", async (c) => {
  const actionId = c.req.param("actionId");
  const body = await c.req.json<{ body?: string; dueAt?: string | null; completedAt?: string | null }>();
  const db = await getPgliteDb();
  const updates: Record<string, unknown> = {};
  if (body.body !== undefined) updates.body = body.body;
  if (body.dueAt !== undefined) updates.dueAt = body.dueAt ? new Date(body.dueAt) : null;
  if (body.completedAt !== undefined) updates.completedAt = body.completedAt ? new Date(body.completedAt) : null;
  const [row] = await db.update(pmActionItems).set(updates).where(eq(pmActionItems.id, actionId)).returning();
  if (!row) return c.json({ error: "Not found" }, 404);
  return c.json({ actionItem: row });
});

app.delete("/postmortem/actions/:actionId", async (c) => {
  const actionId = c.req.param("actionId");
  const db = await getPgliteDb();
  await db.delete(pmActionItems).where(eq(pmActionItems.id, actionId));
  return c.json({ ok: true });
});

app.post("/postmortem/incidents/:id/links", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ toIncidentId?: string; similarityNote?: string }>();
  if (!body.toIncidentId) {
    return c.json({ error: "toIncidentId required" }, 400);
  }
  if (body.toIncidentId === id) {
    return c.json({ error: "Cannot link incident to itself" }, 400);
  }
  const db = await getPgliteDb();
  const [row] = await db
    .insert(pmRecurrenceLinks)
    .values({
      fromIncidentId: id,
      toIncidentId: body.toIncidentId,
      similarityNote: body.similarityNote ?? null,
    })
    .returning();
  return c.json({ link: row }, 201);
});

app.delete("/postmortem/links/:linkId", async (c) => {
  const linkId = c.req.param("linkId");
  const db = await getPgliteDb();
  await db.delete(pmRecurrenceLinks).where(eq(pmRecurrenceLinks.id, linkId));
  return c.json({ ok: true });
});

app.get("/postmortem/recurrence", async (c) => {
  const ownerId = c.req.query("ownerId");
  const threshold = parseFloat(c.req.query("threshold") ?? "0.4");
  if (!ownerId) return c.json({ error: "ownerId required" }, 400);
  const db = await getPgliteDb();
  const rows = await db
    .select()
    .from(pmIncidents)
    .where(eq(pmIncidents.ownerId, ownerId));
  // Compute pairwise token-overlap similarity on rootcause_md
  const suggestions: Array<{ fromId: string; toId: string; fromTitle: string; toTitle: string; similarity: number }> = [];
  const tokenized = rows.map((r) => ({
    id: r.id,
    title: r.title,
    tokens: tokenize(r.rootcauseMd ?? r.summary ?? r.title),
  }));
  for (let i = 0; i < tokenized.length; i += 1) {
    for (let j = i + 1; j < tokenized.length; j += 1) {
      const sim = jaccard(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= threshold) {
        suggestions.push({
          fromId: tokenized[i].id,
          toId: tokenized[j].id,
          fromTitle: tokenized[i].title,
          toTitle: tokenized[j].title,
          similarity: sim,
        });
      }
    }
  }
  suggestions.sort((a, b) => b.similarity - a.similarity);
  return c.json({ suggestions: suggestions.slice(0, 20) });
});

function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 3),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) if (b.has(t)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

async function main() {
  await getPgliteDb();
  serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" });
  console.log(`DB gateway ready: http://127.0.0.1:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
