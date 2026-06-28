"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { ExplainNode } from "@market-standard/db/schema/lens";
import type { ExplainFinding } from "@/lib/explain";

interface ExplainResult {
  score: number;
  durationEstimateMs: number;
  findings: ExplainFinding[];
  plan: ExplainNode[];
  recommendations: string[];
}

function severityLabel(s: ExplainFinding["severity"]): string {
  return s === "high" ? "ms-badge-error" : s === "medium" ? "ms-badge-warn" : "ms-badge-neutral";
}

function PlanTree({ nodes, depth = 0 }: { nodes: ExplainNode[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "space-y-1" : "ml-4 space-y-1 border-l border-[var(--hairline)] pl-3"}>
      {nodes.map((n, i) => (
        <li key={`${n.nodeType}-${i}`} className="text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-semibold">{n.nodeType}</span>
            {n.relation && <span className="ms-app-muted">on {n.relation}</span>}
            {n.rows !== undefined && <span className="ms-badge ms-badge-neutral text-[10px]">~{n.rows.toLocaleString()} rows</span>}
            {n.cost !== undefined && <span className="ms-badge ms-badge-info text-[10px]">cost {n.cost.toFixed(2)}</span>}
          </div>
          {n.children && n.children.length > 0 && <PlanTree nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

function ExplainerInner() {
  const params = useSearchParams();
  const [sql, setSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExplainResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial = params.get("sql");
    if (initial) setSql(initial);
  }, [params]);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!sql.trim()) {
      setError("Paste a SQL query to analyze");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/queries/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql }),
      });
      const data = (await res.json()) as { result?: ExplainResult; error?: string };
      if (!res.ok || !data.result) {
        setError(data.error ?? "Analysis failed");
        return;
      }
      setResult(data.result);
    } catch {
      setError("Could not analyze query");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    result && result.score >= 75
      ? "text-[var(--color-success,#22c55e)]"
      : result && result.score >= 40
        ? "text-[var(--color-warn,#f59e0b)]"
        : "text-[var(--color-error,#ef4444)]";

  return (
    <div className="space-y-4">
      <form onSubmit={handleAnalyze} className="ms-card p-4 space-y-3">
        <label htmlFor="lens-explain-sql" className="text-xs ms-app-muted">SQL query</label>
        <textarea
          id="lens-explain-sql"
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="SELECT * FROM orders WHERE date_trunc('day', created_at) = now()"
          rows={5}
          className="ms-input w-full font-mono text-xs"
          disabled={loading}
        />
        <div className="flex items-center gap-3">
          <button type="submit" className="ms-btn ms-btn-primary" disabled={loading}>
            {loading ? "Analyzing…" : "Analyze query"}
          </button>
          {error && <span className="text-xs ms-app-error">{error}</span>}
        </div>
      </form>

      {result && (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="ms-card p-4 md:col-span-1 space-y-3">
            <div>
              <p className="text-xs ms-app-muted">Query score</p>
              <p className={`text-4xl font-bold ${scoreColor}`}>{result.score}</p>
              <p className="text-xs ms-app-muted">est. {result.durationEstimateMs}ms</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs ms-app-muted uppercase tracking-wide">Findings</p>
              {result.findings.length === 0 ? (
                <p className="text-xs">No anti-patterns detected.</p>
              ) : (
                result.findings.map((f, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`ms-badge ${severityLabel(f.severity)} text-[10px]`}>{f.severity}</span>
                      <span className="font-mono">{f.rule}</span>
                    </div>
                    <p className="ms-app-muted">{f.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ms-card p-4 md:col-span-2 space-y-3">
            <div>
              <p className="text-xs ms-app-muted uppercase tracking-wide">EXPLAIN plan</p>
              <PlanTree nodes={result.plan} />
            </div>
            {result.recommendations.length > 0 && (
              <div>
                <p className="text-xs ms-app-muted uppercase tracking-wide">Recommendations</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  {result.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function QueryExplainer() {
  return (
    <Suspense fallback={<div className="ms-card p-4 text-sm ms-app-muted">Loading…</div>}>
      <ExplainerInner />
    </Suspense>
  );
}
