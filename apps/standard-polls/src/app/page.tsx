import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { polls, workspaces } from "@market-standard/db/schema/polls";
import { count } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ installed?: string; poll_created?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const isLocal = process.env.NEXT_PUBLIC_LOCAL_DEV === "true";
  const installUrl = isLocal ? "/api/dev/mock-install" : "/api/slack/oauth/install";

  let workspaceCount = 0;
  let pollCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const stats = await fetchGateway<{ workspaces: number; polls: number }>("/polls/stats");
      workspaceCount = stats.workspaces;
      pollCount = stats.polls;
    } else {
      const db = await getDbAsync();
      const [ws] = await db.select({ count: count() }).from(workspaces);
      const [ps] = await db.select({ count: count() }).from(polls);
      workspaceCount = ws?.count ?? 0;
      pollCount = ps?.count ?? 0;
    }
  } catch {
    // DB not ready yet
  }

  const dbHint =
    workspaceCount > 0 || pollCount > 0
      ? `Live data: ${workspaceCount} workspace${workspaceCount === 1 ? "" : "s"}, ${pollCount} poll${pollCount === 1 ? "" : "s"}`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      {(params.installed === "true" || params.poll_created === "true") && (
        <div className="border-b border-green-800/40 bg-green-950/80 px-4 py-2 text-center text-sm text-green-200">
          {params.poll_created === "true"
            ? "Poll created — stats updated below."
            : "Workspace installed — stats updated below."}
        </div>
      )}
      <MarketingLanding
        product="standard-polls"
        productLabel="Standard Polls"
        eyebrow="Market Standard · Slack engagement"
        headline={
          <>
            Every poll is a{" "}
            <span className="ms-flood-text">
              brand moment.
            </span>
          </>
        }
        lede="Create interactive polls in Slack channels with one slash command. Every vote spreads your product to the whole team — and across Slack Connect channels."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Free tier: 10 polls/month.</strong> Paid plans remove
            limits and the powered-by badge.
          </>
        }
        primaryCta={{
          label: isLocal ? "Mock Add to Slack" : "Add to Slack",
          href: installUrl,
        }}
        secondaryCta={{
          label: isLocal ? "Try poll simulator" : "See how it works",
          href: isLocal ? "/dev" : "#capabilities",
        }}
        stats={[
          { value: "/poll", label: "slash command" },
          { value: "0$", label: "paid acquisition" },
          { value: "24/7", label: "channel exposure" },
        ]}
        missionTitle="Turn Slack channels into your distribution engine."
        missionBody="Standard Polls exists because the best product feedback happens in Slack — but most teams still use ad-hoc emoji reactions. We give you structured polls with a viral footer on every message, so each question becomes organic marketing."
        featuresTitle="Built for teams that live in Slack."
        features={[
          {
            title: "Slash-command polls",
            body: "Type /poll Question? | Option A | Option B and post an interactive Block Kit message in seconds.",
          },
          {
            title: "Viral powered-by footer",
            body: "Every poll carries a Market Standard badge. The whole channel sees it — including Slack Connect guests.",
          },
          {
            title: "Anonymous voting",
            body: "Sensitive team decisions stay private. Toggle anonymity per poll without extra setup.",
          },
          {
            title: "Plan-aware limits",
            body: "Free workspaces get 10 polls/month. Upgrade when volume grows or when you want a clean brand.",
          },
          {
            title: "Ack-first performance",
            body: "Built on Vercel Slack Bolt with deferred processing — snappy in busy channels.",
          },
          {
            title: "Marketplace-ready",
            body: "Minimal OAuth scopes, demo video path, and a public landing page built for Slack App Directory SEO.",
          },
        ]}
        stepsTitle="From install to first poll in under two minutes."
        steps={[
          "Install Standard Polls to your Slack workspace with one click.",
          "Invite the bot to any channel where you want polls.",
          "Run /poll with your question and pipe-separated options.",
          "Watch votes roll in — every poll spreads your brand to the channel.",
          "Upgrade when you outgrow free limits or want badge-free polls.",
        ]}
        pricingTitle="Simple tiers for growing teams."
        pricing={[
          { tier: "Free", price: "$0", limits: "10 polls/month · powered-by badge required" },
          { tier: "Starter", price: "$19/mo", limits: "100 polls/month · removable badge", highlight: true },
          { tier: "Growth", price: "$49/mo", limits: "Unlimited polls · removable badge" },
        ]}
        proofTitle="Organic growth, not ad spend."
        proofPoints={[
          "Slack App Directory discovery for poll, survey, and vote keywords",
          "Footer impressions on every poll in every channel",
          "Cross-workspace exposure via Slack Connect shared channels",
          "Zero paid acquisition — viral loop is the GTM strategy",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
