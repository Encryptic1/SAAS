import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { releaseNotes, releaseRepos } from "@market-standard/db/schema/release";
import { count } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let repoCount = 0;
  let noteCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const repos = await fetchGateway<Array<{ id: string }>>("/release/repos");
      repoCount = repos.length;
      const notes = await fetchGateway<unknown[]>("/release/notes");
      noteCount = notes.length;
    } else {
      const db = await getDbAsync();
      const [r] = await db.select({ count: count() }).from(releaseRepos);
      const [n] = await db.select({ count: count() }).from(releaseNotes);
      repoCount = r?.count ?? 0;
      noteCount = n?.count ?? 0;
    }
  } catch {
    // DB not ready
  }

  const dbHint =
    repoCount > 0 || noteCount > 0
      ? `Live data: ${repoCount} repo${repoCount === 1 ? "" : "s"}, ${noteCount} release note${noteCount === 1 ? "" : "s"}`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-release"
        productLabel="Standard Release"
        eyebrow="Market Standard · release notes"
        headline={
          <>
            Ship notes from{" "}
            <span className="ms-flood-text">merged PRs.</span>
          </>
        }
        lede="Connect a GitHub repo, generate markdown release notes from merged pull requests since your last tag, edit in the dashboard, and publish when ready."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Changelog automation without the ceremony.</strong>{" "}
            One button turns merged PRs into draft release notes.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Connect repo", href: "/dashboard/repos" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "GitHub", label: "PR source" },
          { value: "Markdown", label: "editable output" },
          { value: "Tags", label: "since last" },
        ]}
        missionTitle="Release notes that write themselves."
        missionBody="Standard Release pulls merged pull requests from GitHub, groups them into markdown, and lets you polish before publish. No more copy-pasting PR titles into CHANGELOG.md."
        featuresTitle="From merge to publish."
        features={[
          {
            title: "GitHub repo connect",
            body: "Add any public or private repo with owner/name — uses GITHUB_TOKEN for API access.",
          },
          {
            title: "Since last tag",
            body: "Generation scopes to PRs merged after your latest git tag.",
          },
          {
            title: "Markdown editor",
            body: "Edit generated notes in the dashboard before publishing.",
          },
          {
            title: "Draft & publish",
            body: "Save drafts and mark notes published when they ship.",
          },
          {
            title: "Multi-repo",
            body: "Connect multiple repositories from one dashboard.",
          },
          {
            title: "Local dev gateway",
            body: "Full workflow works offline with the Market Standard DB gateway.",
          },
        ]}
        stepsTitle="Ship a changelog this week."
        steps={[
          "Connect your GitHub repository.",
          "Click generate to pull merged PRs since the last tag.",
          "Edit the markdown draft in the dashboard.",
          "Publish when the release goes live.",
          "Upgrade for unlimited repos and generations.",
        ]}
        pricingTitle="Free to start. Unlimited when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "1 repo · 5 generations/mo" },
          { tier: "Starter", price: "$15/mo", limits: "Unlimited repos & generations", highlight: true },
        ]}
        proofTitle="Changelog workflow, simplified."
        proofPoints={[
          "PR titles and authors in generated markdown",
          "Version derived from tag history",
          "Editable before publish",
          "Gateway mode for local development",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
