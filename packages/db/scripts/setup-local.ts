import path from "node:path";
import { fileURLToPath } from "node:url";
import { closePglite, getPgliteDb } from "../src/local";
import { pushLocalSchema } from "../src/push-local-schema";
import { metricSnapshots, paymentLinks, quotaSamples, stripeAccounts } from "../src/schema/metrics";
import { polls, votes, workspaces } from "../src/schema/polls";
import { collections, testimonials } from "../src/schema/proof";
import { kpiEvents } from "../src/schema/shared";
import { linkClickEvents, linkRecords } from "../src/schema/links";
import { standupPrompts, standupResponses } from "../src/schema/standup";
import { webhookEvents, webhookInboxes } from "../src/schema/hook";
import { releaseNotes, releaseRepos } from "../src/schema/release";
import { snippets, snippetVersions, snippetShares } from "../src/schema/snippets";
import { pipelines, deployments, incidents } from "../src/schema/status";
import { patterns as regexPatterns, patternForks } from "../src/schema/regex";
import {
  postmortemIncidents as pmIncidents,
  postmortemActionItems as pmActionItems,
  postmortemRecurrenceLinks as pmRecurrenceLinks,
} from "../src/schema/postmortem";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const DATA_DIR = path.join(ROOT, ".pglite", "market-standard");

process.env.DATABASE_DRIVER = "pglite";
process.env.PGLITE_DATA_DIR = DATA_DIR;

async function seed(db: Awaited<ReturnType<typeof getPgliteDb>>) {
  console.log("Seeding demo data...");

  await db.delete(kpiEvents);
  await db.delete(testimonials);
  await db.delete(collections);
  await db.delete(votes);
  await db.delete(polls);
  await db.delete(standupResponses);
  await db.delete(standupPrompts);
  await db.delete(webhookEvents);
  await db.delete(webhookInboxes);
  await db.delete(releaseNotes);
  await db.delete(releaseRepos);
  await db.delete(workspaces);
  await db.delete(linkClickEvents);
  await db.delete(linkRecords);
  await db.delete(snippetShares);
  await db.delete(snippetVersions);
  await db.delete(snippets);
  await db.delete(incidents);
  await db.delete(deployments);
  await db.delete(pipelines);
  await db.delete(patternForks);
  await db.delete(regexPatterns);
  await db.delete(pmRecurrenceLinks);
  await db.delete(pmActionItems);
  await db.delete(pmIncidents);
  await db.delete(quotaSamples);
  await db.delete(paymentLinks);
  await db.delete(metricSnapshots);
  await db.delete(stripeAccounts);

  const [workspace] = await db
    .insert(workspaces)
    .values({
      slackTeamId: "T_DEMO_WORKSPACE",
      slackTeamName: "Market Standard Demo",
      botToken: "xoxb-demo-token",
      plan: "free",
      showBadge: true,
    })
    .returning();

  await db.insert(polls).values({
    workspaceId: workspace!.id,
    channelId: "C_GENERAL",
    question: "What should we build next?",
    options: ["Standard Polls", "Standard Proof", "Standard Metrics"],
    createdBy: "U_DEMO",
    isAnonymous: false,
  });

  const [collection] = await db
    .insert(collections)
    .values({
      slug: "demo",
      name: "Demo Wall of Love",
      ownerId: "local-dev",
      plan: "free",
      showBadge: true,
      theme: "light",
    })
    .returning();

  await db.insert(testimonials).values([
    {
      collectionId: collection!.id,
      authorName: "Alex Chen",
      authorTitle: "Founder, Acme Co",
      content: "Standard Proof made it effortless to showcase customer love on our landing page.",
      rating: 5,
      isApproved: true,
      isFeatured: true,
    },
    {
      collectionId: collection!.id,
      authorName: "Jordan Lee",
      authorTitle: "Marketing Lead",
      content: "Setup took 5 minutes. The embed looks great on our Webflow site.",
      rating: 5,
      isApproved: true,
      isFeatured: false,
    },
    {
      collectionId: collection!.id,
      authorName: "Sam Rivera",
      authorTitle: "Product Manager",
      content: "The powered-by badge actually drove new signups for us. Win-win.",
      rating: 5,
      isApproved: true,
      isFeatured: false,
    },
  ]);

  const [account] = await db
    .insert(stripeAccounts)
    .values({
      stripeAccountId: "acct_demo_local",
      ownerId: "local-dev",
      accessToken: "sk_demo_local",
      plan: "free",
    })
    .returning();

  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const mrr = 11200 + (6 - i) * 200;
    await db.insert(metricSnapshots).values({
      stripeAccountId: account!.id,
      snapshotDate: date,
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
      churnRate: "0.0320",
      ltv: (mrr / 0.032).toFixed(2),
      activeSubscriptions: 130 + (6 - i) * 2,
      breakdown: { source: "local_seed" },
    });
  }

  await db.insert(kpiEvents).values([
    { product: "standard-polls", event: "install", userId: "local-dev" },
    { product: "standard-proof", event: "embed_view", userId: "local-dev" },
    { product: "standard-metrics", event: "dashboard_view", userId: "local-dev" },
  ]);

  await db.insert(linkRecords).values([
    {
      ownerId: "local-dev",
      slug: "pro-annual",
      name: "Pro plan — annual",
      stripeUrl: "https://buy.stripe.com/demo_pro_annual",
      stripeLinkId: "plink_demo_pro_annual",
      active: true,
      clickCount: 142,
      lastClickedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      metadata: { source: "local_seed" },
    },
    {
      ownerId: "local-dev",
      slug: "starter-monthly",
      name: "Starter — monthly",
      stripeUrl: "https://buy.stripe.com/demo_starter_monthly",
      stripeLinkId: "plink_demo_starter",
      active: true,
      clickCount: 38,
      lastClickedAt: new Date(Date.now() - 36 * 60 * 60 * 1000),
      metadata: { source: "local_seed" },
    },
    {
      ownerId: "local-dev",
      slug: "team-seat",
      name: "Team add-on seat",
      stripeUrl: "https://buy.stripe.com/demo_team_seat",
      active: false,
      clickCount: 7,
      metadata: { source: "local_seed" },
    },
  ]);

  await db.insert(quotaSamples).values({
    stripeAccountId: account!.id,
    source: "stripe",
    quotaLabel: "API requests / minute",
    used: 42,
    limit: 100,
    windowStartedAt: new Date(Date.now() - 60_000),
    windowEndsAt: new Date(),
    metadata: { source: "local_seed" },
  });

  // Standard Snippets — demo snippet
  const [demoSnippet] = await db
    .insert(snippets)
    .values({
      ownerId: "00000000-0000-0000-0000-000000000001",
      title: "Debounce (TypeScript)",
      language: "typescript",
      body: `export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}`,
      tags: ["typescript", "utility", "react"],
    })
    .returning();
  if (demoSnippet) {
    await db.insert(snippetVersions).values({
      snippetId: demoSnippet.id,
      body: demoSnippet.body,
      versionNote: "initial",
      createdBy: demoSnippet.ownerId,
      versionNumber: 1,
    });
  }

  // Standard Status — demo pipeline + deployment + incident
  const [demoPipeline] = await db
    .insert(pipelines)
    .values({
      ownerId: "local-dev",
      source: "github",
      repoFullName: "marketstandard/saas",
      name: "CI / Tests",
      lastStatus: "success",
      lastRunAt: new Date(Date.now() - 30 * 60 * 1000),
      last30Runs: [
        { status: "success", at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { status: "success", at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
        { status: "failed", at: new Date(Date.now() - 90 * 60 * 1000).toISOString() },
        { status: "success", at: new Date(Date.now() - 120 * 60 * 1000).toISOString() },
      ],
    })
    .returning();
  if (demoPipeline) {
    await db.insert(deployments).values({
      pipelineId: demoPipeline.id,
      environment: "production",
      sha: "abc1234",
      status: "ready",
      url: "https://marketstandard.app",
    });
    await db.insert(deployments).values({
      pipelineId: demoPipeline.id,
      environment: "preview",
      sha: "def5678",
      status: "ready",
      url: "https://preview.marketstandard.app",
    });
  }
  await db.insert(incidents).values({
    ownerId: "local-dev",
    title: "Stripe webhook delivery delay (resolved)",
    severity: "sev3",
    status: "resolved",
    startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    summary: "Stripe webhook deliveries were delayed ~5min due to upstream incident. Resolved automatically.",
  });

  // Standard Regex — demo patterns
  await db.insert(regexPatterns).values({
    ownerId: "local-dev",
    name: "Email extractor",
    pattern: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}",
    flags: "g",
    description: "Matches standard email addresses in text.",
    testCases: [
      { input: "Contact: hello@marketstandard.app", expectedMatches: 1 },
      { input: "no emails here", expectedMatches: 0 },
      { input: "a@b.co and c@d.io", expectedMatches: 2 },
    ],
    tags: ["email", "validation"],
    isPublic: true,
  });
  await db.insert(regexPatterns).values({
    ownerId: "local-dev",
    name: "ISO date",
    pattern: "\\d{4}-\\d{2}-\\d{2}",
    flags: "g",
    description: "Matches YYYY-MM-DD dates.",
    testCases: [
      { input: "Shipped on 2026-06-27 and 2026-07-01", expectedMatches: 2 },
      { input: "no dates", expectedMatches: 0 },
    ],
    tags: ["date", "validation"],
    isPublic: false,
  });

  // Standard Postmortem — demo incidents (with recurrence signal)
  const [pm1] = await db
    .insert(pmIncidents)
    .values({
      ownerId: "local-dev",
      title: "Stripe webhook delivery delay (June 27)",
      severity: "sev3",
      status: "resolved",
      source: "hook",
      startedAt: new Date(Date.now() - 26 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      summary: "Stripe webhook deliveries were delayed ~5min due to upstream Stripe incident.",
      rootcauseMd:
        "Stripe webhook deliveries were delayed because our retry queue backed up when the upstream Stripe API returned 503s. The retry queue has no backpressure and accumulates messages faster than it can drain. We need to add exponential backoff and a dead-letter queue.",
      timeline: [
        { at: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), text: "Alert fired: webhook lag > 60s" },
        { at: new Date(Date.now() - 25.5 * 60 * 60 * 1000).toISOString(), text: "Identified upstream Stripe 503s" },
        { at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), text: "Stripe recovered; queue drained" },
      ],
      sections: {
        whatWentWell: "Alerting fired within 60s of the queue backing up.",
        whatDidnt: "No backpressure on the retry queue; no dead-letter queue.",
        whereWeGotLucky: "Stripe recovered on its own before our queue hit memory limits.",
      },
    })
    .returning();
  const [pm2] = await db
    .insert(pmIncidents)
    .values({
      ownerId: "local-dev",
      title: "Stripe webhook delivery delay (March 14)",
      severity: "sev3",
      status: "resolved",
      source: "hook",
      startedAt: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000 + 90 * 60 * 1000),
      summary: "Stripe webhook deliveries were delayed ~8min during Stripe upstream incident.",
      rootcauseMd:
        "Stripe webhook deliveries were delayed because our retry queue backed up when the upstream Stripe API returned 503s. The retry queue has no backpressure. We should add exponential backoff.",
      timeline: [
        { at: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000).toISOString(), text: "Alert fired: webhook lag > 60s" },
        { at: new Date(Date.now() - 105 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), text: "Stripe recovered" },
      ],
      sections: {
        whatWentWell: "Alerting fired within 60s.",
        whatDidnt: "No backpressure on the retry queue.",
        whereWeGotLucky: "Stripe recovered quickly.",
      },
    })
    .returning();
  if (pm1 && pm2) {
    await db.insert(pmRecurrenceLinks).values({
      fromIncidentId: pm1.id,
      toIncidentId: pm2.id,
      similarityNote: "Same root cause: retry queue backpressure during Stripe 503s.",
    });
    await db.insert(pmActionItems).values({
      incidentId: pm1.id,
      ownerId: "local-dev",
      body: "Add exponential backoff to webhook retry queue",
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await db.insert(pmActionItems).values({
      incidentId: pm1.id,
      ownerId: "local-dev",
      body: "Add dead-letter queue for messages that fail >5 retries",
      dueAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    });
  }

  console.log("Seed complete.");
}

async function main() {
  console.log(`PGlite data dir: ${DATA_DIR}`);

  const db = await getPgliteDb();
  console.log("Pushing schema (in-process SQL)...");
  await pushLocalSchema(db);
  await seed(db);
  await closePglite();

  console.log("\nLocal database ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
