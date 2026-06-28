import Link from "next/link";
import { getPlan } from "@market-standard/billing";
import {
  Badge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  KpiCard,
  PageHeader,
  PlanBadge,
  PoweredByBadge,
  UsageMeter,
} from "@market-standard/ui";
import { countPollsThisMonth, loadPollsOverview, loadPollsTrend, loadVotesTrend } from "../../lib/polls-data";

export const dynamic = "force-dynamic";

export default async function PollsDashboardPage() {
  const [stats, pollsThisMonth, pollsTrend, votesTrend] = await Promise.all([
    loadPollsOverview(),
    countPollsThisMonth(),
    loadPollsTrend(14),
    loadVotesTrend(14),
  ]);
  const plan = getPlan("standard-polls", "free");
  const limit = plan.limits.pollsPerMonth as number;
  const usagePct = limit > 0 ? Math.round((pollsThisMonth / limit) * 100) : 0;
  const pollsLast = pollsTrend[pollsTrend.length - 1] ?? 0;
  const pollsPrev = pollsTrend[pollsTrend.length - 2] ?? 0;
  const votesLast = votesTrend[votesTrend.length - 1] ?? 0;
  const votesPrev = votesTrend[votesTrend.length - 2] ?? 0;
  const pollsDelta = pollsLast - pollsPrev;
  const votesDelta = votesLast - votesPrev;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Standard Polls"
        title="Overview"
        subtitle="Slack workspace poll activity at a glance."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Overview" }]}
        actions={<PlanBadge plan={plan.tier} />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Workspaces"
          value={String(stats.workspaces)}
          hint="Connected Slack teams"
          spark={[1, 1, 1, 1, 1, 1, 1]}
          sparkBinary
        />
        <KpiCard
          label="Polls"
          value={String(stats.polls)}
          delta={pollsDelta !== 0 ? `${pollsDelta > 0 ? "+" : ""}${pollsDelta} today` : undefined}
          comparison="vs yesterday"
          spark={pollsTrend}
          hint="Last 14 days"
        />
        <KpiCard
          label="Votes"
          value={String(stats.votes ?? 0)}
          delta={votesDelta !== 0 ? `${votesDelta > 0 ? "+" : ""}${votesDelta} today` : undefined}
          comparison="vs yesterday"
          spark={votesTrend}
          hint="Last 14 days"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage this month</CardTitle>
          <CardDescription>Free tier includes {limit} polls per month</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageMeter label="Polls created" used={pollsThisMonth} limit={limit} />
          {usagePct >= 80 && (
            <p className="mt-3 text-xs text-[var(--color-caution)]">
              You&apos;ve used {usagePct}% of your monthly limit.{" "}
              <Link href="/dashboard/billing" className="ms-app-link">
                Upgrade for unlimited polls →
              </Link>
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Link href="/dashboard/polls" className="ms-btn ms-btn-primary no-underline">
              View polls
            </Link>
            {process.env.NEXT_PUBLIC_LOCAL_DEV === "true" && (
              <Link href="/dev" className="ms-btn ms-btn-gilt no-underline">
                Local poll simulator
              </Link>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standup prompts</CardTitle>
            <CardDescription>Automated daily standup questions in Slack</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/standup" className="ms-app-link text-sm">
              Manage standup prompts →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="border-t border-[var(--hairline)] pt-6">
        <PoweredByBadge product="standard-polls" />
      </div>
    </div>
  );
}
