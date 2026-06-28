import Link from "next/link";
import { getPlan } from "@market-standard/billing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PoweredByBadge,
  StatCard,
  UsageMeter,
} from "@market-standard/ui";
import { countPollsThisMonth, loadPollsOverview } from "../../lib/polls-data";

export const dynamic = "force-dynamic";

export default async function PollsDashboardPage() {
  const stats = await loadPollsOverview();
  const pollsThisMonth = await countPollsThisMonth();
  const plan = getPlan("standard-polls", "free");
  const limit = plan.limits.pollsPerMonth as number;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="ms-dash-page-title">Overview</h1>
        <p className="mt-1 text-sm text-[var(--text-mist)]">
          Slack workspace poll activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Workspaces" value={String(stats.workspaces)} />
        <StatCard label="Polls" value={String(stats.polls)} />
        <StatCard label="Votes" value={String(stats.votes ?? 0)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage this month</CardTitle>
          <CardDescription>Free tier includes {limit} polls per month</CardDescription>
        </CardHeader>
        <CardContent>
          <UsageMeter label="Polls created" used={pollsThisMonth} limit={limit} />
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
