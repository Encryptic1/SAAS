import { DocsPage } from "@market-standard/ui";
import { openApiDoc } from "@/lib/openapi";

export default function DocsPageRoute() {
  const endpoints = Object.entries(openApiDoc.paths).flatMap(([path, methods]) =>
    Object.entries(methods).map(([method, op]) => ({ method: method.toUpperCase(), path, summary: op.summary })),
  );

  return (
    <DocsPage
      product="standard-metrics"
      productName="Standard Metrics"
      tagline="Revenue analytics from Stripe."
      sections={[
        {
          id: "overview",
          title: "Overview",
          body: <p>Standard Metrics is part of the Market Standard suite. Revenue analytics from Stripe. This page documents the product and its HTTP API.</p>,
        },
        {
          id: "getting-started",
          title: "Getting started",
          body: (
            <ul>
              <li>Connect Stripe on the settings page.</li><li>Create payment links.</li><li>Open analytics for MRR, churn, and LTV.</li>
            </ul>
          ),
        },
        {
          id: "api",
          title: "HTTP API",
          body: (
            <>
              <p>
                Every endpoint is documented interactively at{" "}
                <a href="/api/docs">/api/docs</a> (Swagger UI). The OpenAPI spec is
                available at <a href="/api/openapi.json">/api/openapi.json</a>.
              </p>
              <div className="ms-docs-endpoints">
                {endpoints.map((e) => (
                  <div key={e.method + e.path} className="ms-docs-endpoint">
                    <span className="ms-docs-method">{e.method}</span>
                    <span className="ms-docs-path">{e.path}</span>
                  </div>
                ))}
              </div>
            </>
          ),
        },
      ]}
      changelog={[
        {
          version: "1.0.0",
          date: "2026-06-28",
          notes: [
            "Public API documented with OpenAPI 3.0 + Swagger UI at /api/docs.",
            "Notification center + team/RBAC added across the suite.",
            "First-run onboarding tour added to every dashboard.",
          ],
        },
      ]}
      loomVideos={[
        { id: "overview", title: "Standard Metrics — product overview", src: "" },
        { id: "api", title: "Using the HTTP API + SDK", src: "" },
      ]}
    />
  );
}
