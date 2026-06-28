import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { snippets } from "@market-standard/db/schema/snippets";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let snippetCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<typeof snippets.$inferSelect[]>("/snippets/snippets?ownerId=00000000-0000-0000-0000-000000000001");
      snippetCount = rows.length;
    }
  } catch {
    // DB not ready
  }

  const dbHint =
    snippetCount > 0 ? `Live data: ${snippetCount} snippet(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-snippets"
        productLabel="Standard Snippets"
        eyebrow="Market Standard · snippets"
        headline={
          <>
            Save, tag, version, and share <span className="ms-flood-text">code snippets.</span>
          </>
        }
        lede="A code snippet manager built for the AI-agent era. Save from VS Code selection, tag + search, auto-version every edit, share via signed URL, and insert into FloodG8 Plan Editor with [[snippet:abc]] references."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">VSIX save-from-selection.</strong>{" "}
            Highlight code in VS Code → "Save as snippet" command → it's in your dashboard, tagged + versioned.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "New snippet", href: "/dashboard/new" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "VSIX", label: "save from selection" },
          { value: "Auto", label: "version history" },
          { value: "[[snippet:]]", label: "Plan Editor insert" },
        ]}
        missionTitle="Snippets that flow into your plan editor."
        missionBody="Standard Snippets is a code snippet manager with sharing, tagging, and versioning — designed to embed into your existing dev loop. Save snippets from VS Code selection, auto-version every edit, share via signed URL, and insert them into FloodG8 Plan Editor with [[snippet:abc123]] references that always resolve to the latest version."
        featuresTitle="Built for the workflow you already have."
        features={[
          {
            title: "VSIX save-from-selection",
            body: "Highlight code in VS Code → run the 'Save as snippet' command → it's in your dashboard with language auto-detected.",
          },
          {
            title: "Auto-versioning",
            body: "Every edit to a snippet body creates a new version row. Restore any prior version with one click.",
          },
          {
            title: "Tag + search",
            body: "Tag snippets (#typescript, #utility, #react) and filter the dashboard by tag. Full-text search coming.",
          },
          {
            title: "Signed share URLs",
            body: "Mint a /s/<slug> URL to share a snippet publicly without auth. Optional expiry. Revoke by deleting the share.",
          },
          {
            title: "FloodG8 Plan Editor insert",
            body: "Paste [[snippet:abc123]] into any FloodG8 plan — the editor resolves it to the latest version body on render.",
          },
          {
            title: "SyncDevTime heartbeat",
            body: "Time spent editing a snippet is tracked via SyncDevTime heartbeat (snippet_id sent in payload).",
          },
        ]}
        stepsTitle="Save your first snippet in 30 seconds."
        steps={[
          "Open the dashboard and click 'New snippet'.",
          "Paste your code, set language + tags.",
          "Save — an initial version is created automatically.",
          "Edit later to auto-create new versions.",
          "Mint a share URL or copy the [[snippet:id]] reference.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "25 snippets · 1 user" },
          { tier: "Starter", price: "$9/mo", limits: "500 snippets + sharing", highlight: true },
        ]}
        proofTitle="Snippets that compound."
        proofPoints={[
          "VSIX save-from-selection",
          "Auto-versioning on every edit",
          "Signed share URLs with expiry",
          "FloodG8 Plan Editor [[snippet:]] refs",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
