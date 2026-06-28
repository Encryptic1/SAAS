import path from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { metricSnapshots, paymentLinks, stripeAccounts } from "../src/schema/metrics";
import { polls, votes, workspaces } from "../src/schema/polls";
import { standupPrompts } from "../src/schema/standup";
import { collections, testimonials } from "../src/schema/proof";
import { kpiEvents } from "../src/schema/shared";

const DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://127.0.0.1:54322/postgres";

async function ensureSchemas(client: postgres.Sql) {
  for (const schemaName of ["shared", "polls", "proof", "metrics"]) {
    await client.unsafe(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
  }
}

async function seed(db: ReturnType<typeof drizzle>) {
  console.log("Seeding demo data...");

  await db.delete(kpiEvents);
  await db.delete(testimonials);
  await db.delete(collections);
  await db.delete(votes);
  await db.delete(polls);
  await db.delete(standupPrompts);
  await db.delete(workspaces);
  await db.delete(metricSnapshots);
  await db.delete(paymentLinks);
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

  await db.insert(standupPrompts).values({
    workspaceId: workspace!.id,
    channelId: "C_GENERAL",
    scheduleCron: "0 9 * * 1-5",
    questions: ["What did you do yesterday?", "What will you do today?", "Any blockers?"],
    enabled: true,
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
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const mrr = 11200 + (29 - i) * 200;
    await db.insert(metricSnapshots).values({
      stripeAccountId: account!.id,
      snapshotDate: date,
      mrr: mrr.toFixed(2),
      arr: (mrr * 12).toFixed(2),
      churnRate: "0.0320",
      ltv: (mrr / 0.032).toFixed(2),
      activeSubscriptions: 130 + (29 - i) * 2,
      breakdown: {
        source: "local_seed",
        by_plan: { starter: { mrr: mrr * 0.6, count: 80 }, growth: { mrr: mrr * 0.4, count: 50 } },
      },
    });
  }

  await db.insert(paymentLinks).values([
    {
      stripeAccountId: account!.id,
      stripeLinkId: "plink_demo_1",
      name: "Starter plan",
      url: "https://buy.stripe.com/demo-starter",
      active: true,
      clickCount: 42,
      updatedAt: new Date(),
    },
    {
      stripeAccountId: account!.id,
      stripeLinkId: "plink_demo_2",
      name: "Growth plan",
      url: "https://buy.stripe.com/demo-growth",
      active: true,
      clickCount: 18,
      updatedAt: new Date(),
    },
  ]);

  await db.insert(kpiEvents).values([
    { product: "standard-polls", event: "install", userId: "local-dev" },
    { product: "standard-proof", event: "embed_view", userId: "local-dev" },
    { product: "standard-metrics", event: "dashboard_view", userId: "local-dev" },
  ]);

  console.log("Seed complete.");
}

async function main() {
  console.log(`Seeding via ${DATABASE_URL}`);

  const client = postgres(DATABASE_URL, { prepare: false, max: 1 });
  await ensureSchemas(client);

  const db = drizzle(client);
  await seed(db);
  await client.end();

  console.log("\nDemo data ready:");
  console.log("  Polls:   http://localhost:3001");
  console.log("  Proof:   http://localhost:3002/c/demo");
  console.log("  Metrics: http://localhost:3003/dashboard");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
