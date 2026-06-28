import { LocalDevBanner, MarketingLanding } from "@market-standard/ui";
import { fetchGateway, isLocalGatewayMode } from "@market-standard/db";
import { vaultProjects, vaultSecrets } from "@market-standard/db/schema/vault";
import { count } from "@market-standard/db/query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let projectCount = 0;
  let secretCount = 0;

  try {
    if (isLocalGatewayMode()) {
      const projects = await fetchGateway<typeof vaultProjects.$inferSelect[]>("/vault/projects?ownerId=local-dev");
      projectCount = projects.length;
      // Sum secrets across projects (best-effort)
      for (const p of projects) {
        const secrets = await fetchGateway<typeof vaultSecrets.$inferSelect[]>(`/vault/projects/${p.id}/secrets`);
        secretCount += secrets.length;
      }
    }
  } catch {
    // DB not ready
  }

  void count;

  const dbHint =
    projectCount > 0 || secretCount > 0
      ? `Live data: ${projectCount} project(s), ${secretCount} encrypted secret(s)`
      : undefined;

  return (
    <>
      <LocalDevBanner />
      <MarketingLanding
        product="standard-vault"
        productLabel="Standard Vault"
        eyebrow="Market Standard · secrets"
        headline={
          <>
            Encrypted secrets with <span className="ms-flood-text">AI-agent reference mode.</span>
          </>
        }
        lede="AES-256-GCM encrypted secrets with .env/Doppler import, a token-authed env-injection CLI, and an AI-agent reference endpoint that lets agents see keys without ever seeing values."
        highlight={
          <>
            <strong className="text-[var(--color-flood)]">Agents see keys, not values.</strong>{" "}
            Toggle <code>agentReference</code> on any secret so AI agents can discover it exists
            without being able to read it.
          </>
        }
        primaryCta={{ label: "Open Dashboard", href: "/dashboard" }}
        secondaryCta={{ label: "Create a project", href: "/dashboard/projects" }}
        tertiaryCta={{ label: "See features", href: "#capabilities" }}
        stats={[
          { value: "AES-256", label: "GCM at rest" },
          { value: "ms-vault", label: "env-injection CLI" },
          { value: "Agents", label: "reference-only" },
        ]}
        missionTitle="Secrets that agents can read about, but not read."
        missionBody="Standard Vault is an encrypted secrets manager designed for the AI-agent era. Store production secrets with AES-256-GCM, inject them into subprocess environments via a token-authed CLI shim, import from .env or Doppler JSON, and expose a reference endpoint that tells AI agents what keys exist without leaking values — so an agent can ask 'does this project have a STRIPE_SECRET_KEY?' without ever being able to exfiltrate it."
        featuresTitle="Built for the agent era."
        features={[
          {
            title: "AES-256-GCM at rest",
            body: "Every secret value is encrypted with a per-tenant key derived from VAULT_MASTER_KEY. Versioned + hashed for rotation tracking.",
          },
          {
            title: "Env-injection CLI",
            body: "ms-vault run --project X --token Y -- npm start injects decrypted secrets into the child process env — never written to disk.",
          },
          {
            title: ".env / Doppler import",
            body: "Paste a .env file or Doppler JSON payload to bulk-import secrets. Comments become notes. Quotes stripped.",
          },
          {
            title: "AI-agent reference mode",
            body: "Per-secret flag exposes key + version (never value) at /api/projects/{id}/references — share with agents safely.",
          },
          {
            title: "Per-project tokens",
            body: "Mint short-lived or long-lived tokens scoped to a single project. Revoke any time. Last-used tracking.",
          },
          {
            title: "Full audit log",
            body: "Every create, rotate, delete, decrypt, and token mint is logged with actor + metadata.",
          },
        ]}
        stepsTitle="Vault your first secret in 60 seconds."
        steps={[
          "Create a project (name + environment).",
          "Add a secret or import an .env file.",
          "Mint an env-injection token.",
          "Run: ms-vault run --project X --token Y -- npm start",
          "Toggle agentReference on keys you want agents to know about.",
        ]}
        pricingTitle="Free to start. Unlimited when you need it."
        pricing={[
          { tier: "Free", price: "$0", limits: "1 project · 25 secrets · agent reference" },
          { tier: "Starter", price: "$19/mo", limits: "Unlimited projects · tokens · audit log", highlight: true },
        ]}
        proofTitle="Encrypted, audited, agent-safe."
        proofPoints={[
          "AES-256-GCM encryption at rest",
          "Token-authed env-injection CLI",
          "AI-agent reference mode (keys only)",
          "Full audit log of every action",
        ]}
        dbHint={dbHint}
      />
    </>
  );
}
