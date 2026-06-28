/**
 * Static EXPLAIN analyzer for the Lens MVP.
 *
 * In production this would run `EXPLAIN (FORMAT JSON)` against the user's
 * connected database (via Vault-stored connection string). For the MVP we
 * ship a heuristic analyzer that flags common anti-patterns and produces a
 * pseudo plan tree + score, so the dashboard is useful without a live DB.
 */

export interface ExplainFinding {
  severity: "high" | "medium" | "low";
  rule: string;
  message: string;
}

export interface ExplainResult {
  score: number; // 0 (worst) — 100 (best)
  durationEstimateMs: number;
  findings: ExplainFinding[];
  plan: ExplainNode[];
  recommendations: string[];
}

import type { ExplainNode } from "@market-standard/db/schema/lens";

export function analyzeQuery(sql: string): ExplainResult {
  const findings: ExplainFinding[] = [];
  const recommendations: string[] = [];
  const normalized = sql.trim().replace(/\s+/g, " ");
  const lower = normalized.toLowerCase();

  const hasSelectStar = /\bselect\s+\*\b/i.test(normalized);
  const hasWhere = /\bwhere\b/i.test(normalized);
  const hasLimit = /\blimit\b/i.test(normalized);
  const hasJoin = /\bjoin\b/i.test(normalized);
  const hasLikePrefix = /\blike\s+'[^%]*%/i.test(normalized);
  const hasOr = /\bor\b/i.test(normalized);
  const hasSubquery = /\(\s*select\b/i.test(normalized);
  const hasOrderBy = /\border\s+by\b/i.test(normalized);
  const hasFuncInWhere = /\bwhere\b[^;]*\b(upper|lower|date_trunc|coalesce)\s*\(/i.test(normalized);
  const hasNotIn = /\bnot\s+in\b/i.test(normalized);

  if (hasSelectStar) {
    findings.push({
      severity: "medium",
      rule: "select-star",
      message: "SELECT * fetches every column — enumerate only the columns you render.",
    });
    recommendations.push("Replace SELECT * with an explicit column list to reduce row width and enable index-only scans.");
  }

  if (hasJoin && !hasWhere && !hasLimit) {
    findings.push({
      severity: "high",
      rule: "unconstrained-join",
      message: "JOIN without WHERE or LIMIT can produce a full cross-product scan.",
    });
    recommendations.push("Add a WHERE clause on an indexed foreign key, or a LIMIT, to bound the join cardinality.");
  }

  if (hasLikePrefix) {
    findings.push({
      severity: "medium",
      rule: "like-prefix-wildcard",
      message: "LIKE 'prefix%' can still use an index; LIKE '%x%' cannot — verify the wildcard position.",
    });
  }

  if (hasOr) {
    findings.push({
      severity: "low",
      rule: "or-predicate",
      message: "OR predicates can defeat index usage — consider UNION ALL or a composite index.",
    });
    recommendations.push("If the OR spans two indexed columns, rewrite as UNION ALL so each branch can use its index.");
  }

  if (hasFuncInWhere) {
    findings.push({
      severity: "medium",
      rule: "function-on-column",
      message: "Wrapping a column in a function in WHERE prevents index usage on that column.",
    });
    recommendations.push("Move the function to the literal side, or add an expression index on the function call.");
  }

  if (hasNotIn) {
    findings.push({
      severity: "medium",
      rule: "not-in",
      message: "NOT IN is slow on large sets and breaks on NULLs — prefer NOT EXISTS.",
    });
    recommendations.push("Rewrite NOT IN (...) as NOT EXISTS (SELECT 1 FROM ... WHERE ...) for better planner behavior.");
  }

  if (hasSubquery) {
    findings.push({
      severity: "low",
      rule: "correlated-subquery",
      message: "Subquery in SELECT — ensure it is not correlated per-row; consider a JOIN instead.",
    });
  }

  if (hasOrderBy && !hasLimit && !hasWhere) {
    findings.push({
      severity: "medium",
      rule: "unbounded-sort",
      message: "ORDER BY without LIMIT forces a full sort of the result set.",
    });
    recommendations.push("Add a LIMIT, or ensure the ORDER BY column has an index matching the sort direction.");
  }

  if (!hasWhere && !hasLimit && /\bselect\b/i.test(normalized)) {
    findings.push({
      severity: "high",
      rule: "full-scan",
      message: "No WHERE or LIMIT — this will scan the entire table.",
    });
    recommendations.push("Add a WHERE predicate on an indexed column, or a LIMIT, to avoid a full table scan.");
  }

  const highCount = findings.filter((f) => f.severity === "high").length;
  const medCount = findings.filter((f) => f.severity === "medium").length;
  const lowCount = findings.filter((f) => f.severity === "low").length;
  const score = Math.max(0, Math.min(100, 100 - highCount * 25 - medCount * 10 - lowCount * 3));
  const durationEstimateMs = Math.round((100 - score) * 4.2 + 5);

  const plan = buildPseudoPlan(normalized, { hasJoin, hasWhere, hasOrderBy, hasSelectStar });

  return { score, durationEstimateMs, findings, plan, recommendations };
}

function buildPseudoPlan(
  sql: string,
  flags: { hasJoin: boolean; hasWhere: boolean; hasOrderBy: boolean; hasSelectStar: boolean },
): ExplainNode[] {
  const tables = Array.from(sql.matchAll(/\b(?:from|join)\s+([a-z_][a-z0-9_.]*)/gi))
    .map((m) => m[1] ?? "")
    .filter(Boolean);
  const primary = tables[0] ?? "unknown_table";

  const scan: ExplainNode = {
    nodeType: flags.hasWhere ? "Index Scan" : "Seq Scan",
    relation: primary,
    alias: primary.split(".").pop(),
    rows: flags.hasWhere ? 240 : 48_000,
    cost: flags.hasWhere ? 8.32 : 1_280.44,
  };

  const nodes: ExplainNode[] = [scan];

  if (flags.hasJoin && tables.length > 1) {
    nodes.push({
      nodeType: "Hash Join",
      rows: 1_200,
      cost: 3_410.0,
      children: tables.slice(1).map((t) => ({
        nodeType: "Seq Scan",
        relation: t,
        alias: t.split(".").pop(),
        rows: 9_800,
        cost: 980.12,
      })),
    });
  }

  if (flags.hasOrderBy) {
    nodes.push({ nodeType: "Sort", rows: scan.rows ?? 1000, cost: 220.5 });
  }

  if (flags.hasSelectStar) {
    nodes.push({ nodeType: "Result", rows: scan.rows ?? 1000, cost: 0.0 });
  }

  return nodes;
}

export function hashSql(sql: string): string {
  let h = 5381;
  for (let i = 0; i < sql.length; i++) {
    h = ((h << 5) + h + sql.charCodeAt(i)) | 0;
  }
  return `q_${(h >>> 0).toString(16)}`;
}
