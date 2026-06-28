import { CronDashboardShell } from "@/components/cron-dashboard-shell";
import { CreateJobForm } from "@/components/create-job-form";
import { JobsList } from "@/components/jobs-list";
import { KpiCard, PageHeader } from "@market-standard/ui";
import { getOwnerId } from "@/lib/owner";
import { listJobs } from "@/lib/cron-data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerId = await getOwnerId();
  if (!ownerId) return <CronDashboardShell><div>Sign in</div></CronDashboardShell>;
  const jobs = await listJobs(ownerId);

  const okCount = jobs.filter((j) => j.lastStatus === "ok").length;
  const failedCount = jobs.filter((j) => j.lastStatus === "failed" || j.lastStatus === "missed").length;
  const sources = new Set(jobs.map((j) => j.source)).size;

  return (
    <CronDashboardShell>
      <div className="space-y-8">
        <PageHeader
          eyebrow="Standard Cron"
          title="Monitored jobs"
          subtitle={`${jobs.length} job(s) across ${sources} source(s).`}
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Jobs" }]}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <KpiCard label="Jobs" value={String(jobs.length)} hint="Monitored" />
          <KpiCard label="Healthy" value={String(okCount)} hint="Last run ok" />
          <KpiCard label="Needs attention" value={String(failedCount)} hint="Failed / missed" />
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold ms-app-muted uppercase tracking-wide">Register a job</h2>
            <CreateJobForm />
          </div>
          <div className="space-y-2">
            <h2 className="text-sm font-semibold ms-app-muted uppercase tracking-wide">Jobs</h2>
            <JobsList jobs={jobs} />
          </div>
        </div>
      </div>
    </CronDashboardShell>
  );
}
