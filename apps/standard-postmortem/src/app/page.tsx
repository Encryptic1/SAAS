import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { postmortemIncidents } from "@market-standard/db/schema/postmortem";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let incidentCount = 0;
  try {
    if (isLocalGatewayMode()) {
      const rows = await fetchGateway<{ incidents: typeof postmortemIncidents.$inferSelect[] }>("/postmortem/incidents?ownerId=local-dev");
      incidentCount = rows.incidents?.length ?? 0;
    }
  } catch {
    // DB not ready
  }
  const dbHint = incidentCount > 0 ? `Live data: ${incidentCount} postmortem(s)` : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-postmortem"
        productLabel="Standard Postmortem"
        eyebrow="Market Standard · postmortem"
        headline={
          <>
            Blameless postmortems that <span className="ms-flood-text">catch recurrence.</span>
          </>
        }
        lede="A blameless incident postmortem tool with the classic template (Summary, Timeline, Root Cause, What went well / didn't / got lucky), action items with due dates, and recurrence detection that surfaces when a new incident looks like an old one — so you stop fixing the same thing twice."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Recurrence detection built in.</strong>{" "}
            Every postmortem's root cause is embedded and compared against past incidents. When a new one looks familiar, Standard Postmortem says so — and links them.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "New postmortem", href: "/dashboard/new" }}
        tertiaryCta={{ label: "Recurrence graph", href: "/dashboard/recurrence" }}
        stats={[
          { value: "Blameless", label: "classic template" },
          { value: "pgvector", label: "recurrence detection" },
          { value: "Hook · Status · Pulse", label: "intake sources" },
        ]}
        missionTitle="Stop fixing the same incident twice."
        missionBody="Standard Postmortem is a blameless postmortem tool with the classic template — Summary, Timeline, Root Cause, What went well, What didn't, Where we got lucky — plus action items with due dates and recurrence detection. Intake flows in from Standard Hook (failed webhooks), Standard Status (failed pipelines/deploys), Suite Pulse (blocker keywords), and Slack (/postmortem create). Every root cause is embedded via text-embedding-3-small and compared against past incidents with pgvector cosine similarity, so when a new incident looks like an old one, you get a suggestion to link them — and the recurrence graph makes patterns visible."
        featuresTitle="Built for the workflow you already have."
        features={[
          {
            title: "Blameless template",
            body: "Summary, Timeline, Root Cause, What went well, What didn't, Where we got lucky. No finger-pointing fields — the template is designed to surface mechanism, not blame.",
          },
          {
            title: "Action items with due dates",
            body: "Attach concrete, owned, dated follow-ups to every postmortem. Mark them complete as they ship. Open items surface on the dashboard.",
          },
          {
            title: "Recurrence detection",
            body: "Root-cause text is embedded and compared across incidents. Similar pairs are surfaced as suggestions on the editor and visualized in the recurrence graph.",
          },
          {
            title: "Intake from Hook + Status + Pulse + Slack",
            body: "Failed webhook in Standard Hook → 'Create postmortem' button. Failed pipeline in Standard Status → deep link. Blocker keyword in Suite Pulse → suggestion. Slack slash command for quick capture.",
          },
          {
            title: "Timeline editor",
            body: "Add timestamped entries as the incident unfolds. The timeline is the backbone of the postmortem — alerts, diagnosis, mitigation, resolution.",
          },
          {
            title: "Cross-links to Status + Hook",
            body: "Link a postmortem to the Standard Status incident that triggered it, or the Standard Hook event that surfaced it — one click back to the source.",
          },
        ]}
        stepsTitle="Write your first postmortem in 5 minutes."
        steps={[
          "Click 'New postmortem' (or hit /api/intake from Hook/Status/Pulse/Slack).",
          "Set title, severity, and source.",
          "Fill in the timeline as the incident unfolded.",
          "Write the root cause — be specific about the mechanism.",
          "Add action items with owners and due dates.",
          "If recurrence is suggested, link the similar incident.",
        ]}
        pricingTitle="Free to start. Pro when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "5 incidents/mo" },
          { tier: "Starter", price: "$19/mo", limits: "unlimited + recurrence + reminders", highlight: true },
        ]}
        proofTitle="Postmortems that compound into learning."
        proofPoints={[
          "Blameless template with all six sections",
          "Action items with due dates + completion tracking",
          "Recurrence detection via pgvector embeddings",
          "Intake from Hook, Status, Pulse, and Slack",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
