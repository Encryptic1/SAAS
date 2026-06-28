import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { patterns } from "@market-standard/db/schema/regex";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let patternCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<{ patterns: typeof patterns.$inferSelect[] }>("/regex/patterns?ownerId=local-dev");
      patternCount = rows.patterns?.length ?? 0;
    }
  } catch {
    // DB not ready
  }
  const dbHint = patternCount > 0 ? `Live data: ${patternCount} pattern(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-regex"
        productLabel="Standard Regex"
        eyebrow="Market Standard · regex"
        headline={
          <>
            Build, test, and explain <span className="ms-flood-text">regex patterns.</span>
          </>
        }
        lede="A regex pattern builder + debugger with capture-group highlighting, an explanation engine, a cheat sheet, and a shareable library. Wire it into your daily dev loop — VSIX test-from-selection, save-as-Hook-filter, save-as-Snippet deep links."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">An explanation engine, not just a tester.</strong>{" "}
            Every token in your pattern gets a human-readable explanation — anchors, character classes, quantifiers, groups, lookarounds.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "New pattern", href: "/dashboard/new" }}
        tertiaryCta={{ label: "Cheat sheet", href: "/dashboard/cheat-sheet" }}
        stats={[
          { value: "Live", label: "match highlighting" },
          { value: "AST", label: "explanation engine" },
          { value: "Public", label: "pattern library + fork" },
        ]}
        missionTitle="Regex you can actually read."
        missionBody="Standard Regex is a regex builder + debugger with an explanation engine that walks every token in your pattern and emits a human-readable description. Test against single inputs or run a suite of test cases with expected-match counts. Save patterns to your library with tags, mark them public to share + fork, and deep-link into Standard Hook (save as webhook body filter) and Standard Snippets (save as a snippet)."
        featuresTitle="Built for the workflow you already have."
        features={[
          {
            title: "Live match highlighting",
            body: "Type a pattern + input and see matches highlighted inline with capture groups expanded. Zero-result and invalid-pattern states are surfaced clearly.",
          },
          {
            title: "Explanation engine",
            body: "Every token — anchors, character classes, quantifiers, groups, lookarounds, alternation, escapes — gets a human-readable explanation rendered as a tree.",
          },
          {
            title: "Test cases with assertions",
            body: "Attach test cases with expected match counts. The runner reports pass/fail per case so you can lock in behavior before saving.",
          },
          {
            title: "Public library + fork",
            body: "Mark a pattern public to share it. Other developers can fork it into their own library and tweak. Tags power search.",
          },
          {
            title: "Cheat sheet",
            body: "An anchored reference for every construct the engine supports — anchors, classes, shorthand, quantifiers, groups, flags, escapes.",
          },
          {
            title: "Hook + Snippets synergy",
            body: "Deep-link a pattern into Standard Hook to create a webhook body filter, or into Standard Snippets to save it as a snippet — same regex, multiple surfaces.",
          },
        ]}
        stepsTitle="Test your first pattern in 30 seconds."
        steps={[
          "Open the dashboard and click 'New pattern'.",
          "Type your regex + flags (g, i, m, s, u).",
          "Paste test input — matches highlight inline and capture groups expand.",
          "Add test cases with expected match counts to lock in behavior.",
          "Save to your library, tag it, mark public to share + fork.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "10 patterns + public library" },
          { tier: "Starter", price: "$9/mo", limits: "unlimited private + fork + cheat sheet", highlight: true },
        ]}
        proofTitle="Regex you can read, test, and share."
        proofPoints={[
          "Live match highlighting + capture groups",
          "Explanation engine for every token",
          "Test cases with expected-match assertions",
          "Public library + fork + Hook/Snippets deep links",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
