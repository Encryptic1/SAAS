"use client";

import { useEffect, useState, useCallback, useMemo } from "react";

type ExplainNode = { token: string; explanation: string; children?: ExplainNode[] };
type MatchResult = { match: string; index: number; groups: Record<string, string> };
type TestCaseResult = {
  input: string;
  expectedMatches: number | null;
  actualMatches: number;
  passed: boolean;
  matches: MatchResult[];
  error?: string;
};
type HighlightSegment = { text: string; matchIndex: number | null };
type TestCase = { input: string; expectedMatches: number | null; note?: string };

const FLAG_OPTIONS: Array<{ flag: string; label: string; desc: string }> = [
  { flag: "g", label: "global", desc: "Find all matches (don't stop at first)" },
  { flag: "i", label: "case-insensitive", desc: "Ignore case when matching" },
  { flag: "m", label: "multiline", desc: "^ and $ match line boundaries" },
  { flag: "s", label: "dotall", desc: "Dot (.) matches newlines too" },
  { flag: "u", label: "unicode", desc: "Enable unicode mode" },
];

export function RegexEditor({
  initialPattern = "",
  initialFlags = "g",
  initialName = "",
  initialDescription = "",
  initialTestCases = [] as TestCase[],
  initialTags = [] as string[],
  initialIsPublic = false,
  patternId,
}: {
  initialPattern?: string;
  initialFlags?: string;
  initialName?: string;
  initialDescription?: string;
  initialTestCases?: TestCase[];
  initialTags?: string[];
  initialIsPublic?: boolean;
  patternId?: string;
}) {
  const [pattern, setPattern] = useState(initialPattern);
  const [flags, setFlags] = useState(initialFlags);
  const [input, setInput] = useState(initialTestCases[0]?.input ?? "");
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [testCases, setTestCases] = useState<TestCase[]>(initialTestCases);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [segments, setSegments] = useState<HighlightSegment[]>([]);
  const [explanation, setExplanation] = useState<ExplainNode[]>([]);
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<string | null>(null);

  const runTest = useCallback(async () => {
    const res = await fetch("/api/patterns/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pattern, flags, input, testCases }),
    });
    const data = (await res.json()) as {
      matches: MatchResult[];
      segments: HighlightSegment[];
      explanation: ExplainNode[];
      testResults: TestCaseResult[];
      error?: string;
    };
    setMatches(data.matches ?? []);
    setSegments(data.segments ?? []);
    setExplanation(data.explanation ?? []);
    setTestResults(data.testResults ?? []);
    setError(data.error ?? null);
  }, [pattern, flags, input, testCases]);

  useEffect(() => {
    const t = setTimeout(() => {
      void runTest();
    }, 250);
    return () => clearTimeout(t);
  }, [runTest]);

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.replace(f, "") : cur + f));
  }

  async function handleSave() {
    setSaveState("Saving…");
    try {
      const payload = {
        name,
        pattern,
        flags,
        description,
        testCases,
        tags,
        isPublic,
      };
      const res = patternId
        ? await fetch(`/api/patterns/${patternId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/patterns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setSaveState(`Error: ${d.error ?? "save failed"}`);
        return;
      }
      setSaveState(patternId ? "Saved" : "Created");
      if (!patternId) {
        const d = (await res.json()) as { pattern: { id: string } };
        window.location.href = `/dashboard/${d.pattern.id}`;
      }
    } catch {
      setSaveState("Network error");
    }
  }

  const passingTests = useMemo(() => testResults.filter((t) => t.passed).length, [testResults]);
  const allTestsPass = testCases.length > 0 && passingTests === testResults.length;

  return (
    <div className="space-y-5">
      <div className="ms-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm ms-app-muted">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="enter your regex…"
            className="ms-input flex-1 font-mono"
            spellCheck={false}
          />
          <span className="font-mono text-sm ms-app-muted">/</span>
          <input
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="ms-input w-20 font-mono text-center"
            spellCheck={false}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FLAG_OPTIONS.map((f) => (
            <button
              key={f.flag}
              type="button"
              onClick={() => toggleFlag(f.flag)}
              className={`ms-flag-toggle ${flags.includes(f.flag) ? "ms-flag-active" : ""}`}
              title={f.desc}
            >
              <span className="font-mono font-semibold">{f.flag}</span>
              <span className="text-xs ms-app-muted ml-1">{f.label}</span>
            </button>
          ))}
        </div>
        {error && <p className="ms-app-error text-xs font-mono">{error}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="ms-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="ms-label">Test input</label>
              <span className="text-xs ms-app-muted">{matches.length} match(es)</span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="ms-input font-mono text-sm"
              spellCheck={false}
            />
            <div className="ms-highlight-box font-mono text-sm whitespace-pre-wrap break-words">
              {segments.length === 0 ? (
                <span className="ms-app-muted">{input || "enter text to test"}</span>
              ) : (
                segments.map((seg, i) => (
                  <span key={i} className={seg.matchIndex !== null ? "ms-match" : ""}>
                    {seg.text}
                  </span>
                ))
              )}
            </div>
          </div>

          {matches.length > 0 && (
            <div className="ms-card p-4 space-y-2">
              <label className="ms-label">Matches &amp; capture groups</label>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {matches.map((m, i) => (
                  <div key={i} className="ms-row p-2 rounded border border-white/5">
                    <div className="flex items-center justify-between text-xs ms-app-muted">
                      <span>#{i + 1} at index {m.index}</span>
                      <span className="font-mono">{m.match.length} chars</span>
                    </div>
                    <p className="font-mono text-sm mt-1 break-all">{m.match}</p>
                    {Object.keys(m.groups).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(m.groups).map(([k, v]) => (
                          <div key={k} className="text-xs flex gap-2">
                            <span className="ms-app-muted font-mono">{k}:</span>
                            <span className="font-mono break-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {testCases.length > 0 && (
            <div className="ms-card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <label className="ms-label">Test cases ({passingTests}/{testResults.length} passing)</label>
                <span className={`text-xs ${allTestsPass ? "ms-status-success" : "ms-status-failed"}`}>
                  {allTestsPass ? "✓ all pass" : "✗ failing"}
                </span>
              </div>
              <div className="space-y-2">
                {testResults.map((tc, i) => (
                  <div
                    key={i}
                    className={`ms-row p-2 rounded border ${tc.passed ? "border-emerald-500/30" : "border-rose-500/30"}`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className={tc.passed ? "ms-status-success" : "ms-status-failed"}>
                        {tc.passed ? "✓ pass" : "✗ fail"}
                      </span>
                      <span className="ms-app-muted">
                        expected {tc.expectedMatches ?? "—"} / got {tc.actualMatches}
                      </span>
                    </div>
                    <p className="font-mono text-xs mt-1 break-all">{tc.input}</p>
                    {tc.error && <p className="text-xs ms-app-error mt-1">{tc.error}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="ms-card p-4 space-y-2">
            <label className="ms-label">Explanation</label>
            {explanation.length === 0 ? (
              <p className="text-xs ms-app-muted">Enter a pattern to see its explanation.</p>
            ) : (
              <div className="space-y-1.5 max-h-96 overflow-y-auto">
                {explanation.map((node, i) => (
                  <ExplainNodeView key={i} node={node} depth={0} />
                ))}
              </div>
            )}
          </div>

          <div className="ms-card p-4 space-y-3">
            <div className="space-y-1">
              <label className="ms-label">Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Email extractor" className="ms-input" />
            </div>
            <div className="space-y-1">
              <label className="ms-label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="ms-input"
              />
            </div>
            <div className="space-y-1">
              <label className="ms-label">Tags (comma-separated)</label>
              <input
                value={tags.join(", ")}
                onChange={(e) => setTags(e.target.value.split(",").map((t) => t.trim()).filter(Boolean))}
                className="ms-input"
                placeholder="email, validation"
              />
            </div>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
              Public (anyone can view + fork)
            </label>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={handleSave} className="ms-btn">
                {patternId ? "Save changes" : "Save to library"}
              </button>
              {saveState && <span className="text-xs ms-app-muted self-center">{saveState}</span>}
            </div>
            <div className="flex gap-2 flex-wrap text-xs">
              <a
                href={`https://hook.marketstandard.app/?pattern=${encodeURIComponent(pattern)}`}
                className="ms-btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                Save as Hook filter →
              </a>
              <a
                href={`https://snippets.marketstandard.app/?pattern=${encodeURIComponent(pattern)}`}
                className="ms-btn-ghost"
                target="_blank"
                rel="noreferrer"
              >
                Save as Snippet →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExplainNodeView({ node, depth }: { node: ExplainNode; depth: number }) {
  return (
    <div style={{ paddingLeft: depth * 12 }}>
      <div className="flex gap-2 items-start text-xs">
        <code className="ms-code shrink-0">{node.token}</code>
        <span className="ms-app-muted">{node.explanation}</span>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="mt-1 space-y-1 border-l border-white/5 pl-2">
          {node.children.map((c, i) => (
            <ExplainNodeView key={i} node={c} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
