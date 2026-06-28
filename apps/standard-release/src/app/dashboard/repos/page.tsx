import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState } from "@market-standard/ui";
import { ConnectRepoForm } from "@/components/connect-repo-form";
import { GenerateNotesButton } from "@/components/generate-notes-button";
import { listOwnerRepos } from "@/lib/release-data";

export const dynamic = "force-dynamic";

export default async function ReposPage() {
  const repos = await listOwnerRepos();

  return (
    <>
      <h1 className="ms-app-title">Repos</h1>
      <p className="mt-2 ms-app-muted">Connect GitHub repositories to generate release notes.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Connect repo</CardTitle>
            <CardDescription>Enter owner/repo (e.g. vercel/next.js).</CardDescription>
          </CardHeader>
          <CardContent>
            <ConnectRepoForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your repos</CardTitle>
            <CardDescription>{repos.length} connected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {repos.length === 0 ? (
              <EmptyState
                title="No repos yet"
                description="Connect a GitHub repo to generate release notes from merged PRs."
              />
            ) : (
              repos.map((repo) => (
                <div key={repo.id} className="ms-app-card-inner space-y-3">
                  <p className="font-medium text-[var(--text-foam)]">{repo.repoFullName}</p>
                  <p className="text-sm ms-app-muted">Default branch: {repo.defaultBranch}</p>
                  <GenerateNotesButton repoId={repo.id} />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <p className="mt-6 text-xs ms-app-muted">
        Set <code className="font-mono">GITHUB_TOKEN</code> for private repos and higher API rate limits.
      </p>
    </>
  );
}
