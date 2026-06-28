/**
 * Lightweight regex explanation engine.
 *
 * Walks a pattern string and emits human-readable descriptions for each
 * construct. This is NOT a full parser — it covers the common cases that
 * matter to developers writing regex for daily dev work: literals, anchors,
 * character classes, quantifiers, groups, alternation, escapes, and common
 * shorthand (\d, \w, \s, \b, etc.).
 *
 * Output is an array of { token, explanation } pairs suitable for rendering
 * as a tree.
 */

export type ExplainNode = {
  token: string;
  explanation: string;
  children?: ExplainNode[];
};

const SHORTHAND: Record<string, string> = {
  d: "any digit (0–9)",
  D: "any non-digit",
  w: "any word character ([A-Za-z0-9_])",
  W: "any non-word character",
  s: "any whitespace",
  S: "any non-whitespace",
  b: "a word boundary",
  B: "a non-word-boundary",
  n: "a newline",
  t: "a tab",
  r: "a carriage return",
};

export function explainRegex(pattern: string): ExplainNode[] {
  const nodes: ExplainNode[] = [];
  let i = 0;

  while (i < pattern.length) {
    const ch = pattern.charAt(i);
    if (!ch) break;

    // Escape sequences
    if (ch === "\\") {
      const next = pattern[i + 1];
      if (!next) {
        nodes.push({ token: "\\", explanation: "trailing backslash (likely invalid)" });
        i += 1;
        continue;
      }
      const desc = SHORTHAND[next];
      if (desc) {
        nodes.push({ token: `\\${next}`, explanation: `Matches ${desc}` });
      } else if (next === "x" && /[0-9a-fA-F]{2}/.test(pattern.slice(i + 2, i + 4))) {
        nodes.push({ token: `\\x${pattern.slice(i + 2, i + 4)}`, explanation: `Matches the hex character 0x${pattern.slice(i + 2, i + 4)}` });
        i += 4;
        continue;
      } else {
        nodes.push({ token: `\\${next}`, explanation: `Matches the literal character '${next}'` });
      }
      i += 2;
      continue;
    }

    // Anchors
    if (ch === "^") {
      nodes.push({ token: "^", explanation: "Anchor: start of string (or line if 'm' flag)" });
      i += 1;
      continue;
    }
    if (ch === "$") {
      nodes.push({ token: "$", explanation: "Anchor: end of string (or line if 'm' flag)" });
      i += 1;
      continue;
    }

    // Character class
    if (ch === "[") {
      const end = findCharClassEnd(pattern, i);
      const token = pattern.slice(i, end + 1);
      const body = token.slice(1, -1);
      const negated = body.startsWith("^");
      const inner = negated ? body.slice(1) : body;
      const parts = inner.split("-").length > 1 && !inner.startsWith("-") && !inner.endsWith("-")
        ? describeRanges(inner)
        : describeClassBody(inner);
      const explanation = negated
        ? `Matches any character NOT in: ${parts.join(", ")}`
        : `Matches any character in: ${parts.join(", ")}`;
      nodes.push({ token, explanation });
      i = end + 1;
      continue;
    }

    // Groups
    if (ch === "(") {
      const end = findGroupEnd(pattern, i);
      const token = pattern.slice(i, end + 1);
      const inner = token.slice(1, -1);
      let children: ExplainNode[] | undefined;
      let prefix = "Capture group: ";
      let label = token;
      if (inner.startsWith("?:")) {
        prefix = "Non-capturing group: ";
        children = explainRegex(inner.slice(2));
        label = `(?:${inner.slice(2)})`;
      } else if (inner.startsWith("?P<")) {
        const nameEnd = inner.indexOf(">");
        const name = inner.slice(3, nameEnd);
        prefix = `Named capture group '${name}': `;
        children = explainRegex(inner.slice(nameEnd + 1));
        label = token;
      } else if (inner.startsWith("?<")) {
        const nameEnd = inner.indexOf(">");
        const name = inner.slice(2, nameEnd);
        prefix = `Named capture group '${name}': `;
        children = explainRegex(inner.slice(nameEnd + 1));
        label = token;
      } else if (inner.startsWith("?(<") || inner.startsWith("?<=(") || inner.startsWith("?<!(") || inner.startsWith("?=(") || inner.startsWith("?!(")) {
        prefix = "Lookaround group: ";
        children = explainRegex(inner);
      } else {
        children = explainRegex(inner);
      }
      nodes.push({ token: label, explanation: `${prefix}match the sub-pattern`, children });
      i = end + 1;
      continue;
    }

    // Alternation
    if (ch === "|") {
      nodes.push({ token: "|", explanation: "Alternation: match either side" });
      i += 1;
      continue;
    }

    // Quantifiers
    if (ch === "*" || ch === "+" || ch === "?") {
      const prev = nodes[nodes.length - 1];
      const greedy = pattern[i + 1] !== "?";
      const q = ch === "*" ? "zero or more" : ch === "+" ? "one or more" : "optional (zero or one)";
      const explanation = `Quantifier: ${q} of the previous token${greedy ? " (greedy)" : " (lazy)"}`;
      if (prev) {
        prev.token += ch + (greedy ? "" : "?");
        prev.explanation = `${prev.explanation} — ${q}${greedy ? " (greedy)" : " (lazy)"}`;
      } else {
        nodes.push({ token: ch, explanation });
      }
      i += greedy ? 1 : 2;
      continue;
    }
    if (ch === "{") {
      const end = pattern.indexOf("}", i);
      if (end === -1) {
        nodes.push({ token: ch, explanation: `Matches the literal character '{'` });
        i += 1;
        continue;
      }
      const body = pattern.slice(i + 1, end);
      const lazy = pattern[end + 1] === "?";
      const explanation = `Quantifier: ${describeQuantifierBody(body)}${lazy ? " (lazy)" : " (greedy)"}`;
      const prev = nodes[nodes.length - 1];
      if (prev) {
        prev.token += `{${body}}${lazy ? "?" : ""}`;
        prev.explanation = `${prev.explanation} — ${describeQuantifierBody(body)}${lazy ? " (lazy)" : ""}`;
      } else {
        nodes.push({ token: `{${body}}`, explanation });
      }
      i = end + 1 + (lazy ? 1 : 0);
      continue;
    }

    // Dot
    if (ch === ".") {
      nodes.push({ token: ".", explanation: "Matches any character (except newline, unless 's' flag)" });
      i += 1;
      continue;
    }

    // Literal
    nodes.push({ token: ch, explanation: `Matches the literal character '${ch}'` });
    i += 1;
  }

  return nodes;
}

function findCharClassEnd(pattern: string, start: number): number {
  let i = start + 1;
  if (pattern[i] === "^") i += 1;
  if (pattern[i] === "]") i += 1; // ] is literal right after [
  while (i < pattern.length && pattern[i] !== "]") {
    if (pattern[i] === "\\" && i + 1 < pattern.length) i += 2;
    else i += 1;
  }
  return i < pattern.length ? i : pattern.length - 1;
}

function findGroupEnd(pattern: string, start: number): number {
  let depth = 1;
  let i = start + 1;
  while (i < pattern.length && depth > 0) {
    if (pattern[i] === "\\") {
      i += 2;
      continue;
    }
    if (pattern[i] === "[") {
      i = findCharClassEnd(pattern, i) + 1;
      continue;
    }
    if (pattern[i] === "(") depth += 1;
    else if (pattern[i] === ")") depth -= 1;
    i += 1;
  }
  return i - 1;
}

function describeClassBody(body: string): string[] {
  const parts: string[] = [];
  let i = 0;
  while (i < body.length) {
    const cur = body.charAt(i);
    const next = body.charAt(i + 1);
    if (cur === "\\" && next) {
      const sh = SHORTHAND[next];
      parts.push(sh ? `\\${next} (${sh})` : `'${next}'`);
      i += 2;
      continue;
    }
    parts.push(`'${cur}'`);
    i += 1;
  }
  return parts;
}

function describeRanges(body: string): string[] {
  // Detect a-z style ranges
  const rangeRegex = /([^\\]-[^\\]|\\[dDwWsSbB]|\\[^\\]|.)/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  let prevChar: string | null = null;
  while ((m = rangeRegex.exec(body)) !== null) {
    const tok = m[0];
    if (tok.length === 3 && tok[1] === "-") {
      out.push(`range '${tok[0]}'–'${tok[2]}'`);
      prevChar = null;
      continue;
    }
    if (prevChar && tok === "-") {
      // wait for next char
      continue;
    }
    if (prevChar && prevChar !== "-" && tok.startsWith("\\")) {
      out.push(`'${prevChar}'`);
      out.push(tok);
      prevChar = null;
      continue;
    }
    if (prevChar) {
      out.push(`'${prevChar}'`);
    }
    prevChar = tok;
  }
  if (prevChar) out.push(`'${prevChar}'`);
  return out;
}

function describeQuantifierBody(body: string): string {
  if (body === "") return "exactly the previous token";
  if (!body.includes(",")) {
    const n = Number(body);
    return Number.isFinite(n) ? `exactly ${n} of` : "of the previous token";
  }
  const [min, max] = body.split(",");
  if (min === "" && max === "") return "zero or more of";
  if (min === "") return `up to ${max} of`;
  if (max === "") return `at least ${min} of`;
  return `between ${min} and ${max} of`;
}

// ---- Test runner ----

export type MatchResult = {
  match: string;
  index: number;
  groups: Record<string, string>;
};

export type TestCaseResult = {
  input: string;
  expectedMatches: number | null;
  actualMatches: number;
  passed: boolean;
  matches: MatchResult[];
  error?: string;
};

export function runRegex(pattern: string, flags: string, input: string): { matches: MatchResult[]; error?: string } {
  let re: RegExp;
  try {
    re = new RegExp(pattern, flags);
  } catch (err) {
    return { matches: [], error: err instanceof Error ? err.message : "Invalid regex" };
  }
  const matches: MatchResult[] = [];
  if (flags.includes("g")) {
    let m: RegExpExecArray | null;
    let safety = 0;
    while ((m = re.exec(input)) !== null && safety < 1000) {
      const groups: Record<string, string> = {};
      if (m.groups) {
        for (const [k, v] of Object.entries(m.groups)) groups[k] = v ?? "";
      } else {
        for (let g = 1; g < m.length; g += 1) {
          const v = m[g];
          if (v !== undefined) groups[`$${g}`] = v;
        }
      }
      matches.push({ match: m[0] ?? "", index: m.index ?? 0, groups });
      if ((m[0] ?? "") === "") re.lastIndex += 1;
      safety += 1;
    }
  } else {
    const m = re.exec(input);
    if (m) {
      const groups: Record<string, string> = {};
      if (m.groups) {
        for (const [k, v] of Object.entries(m.groups)) groups[k] = v ?? "";
      } else {
        for (let g = 1; g < m.length; g += 1) {
          const v = m[g];
          if (v !== undefined) groups[`$${g}`] = v;
        }
      }
      matches.push({ match: m[0] ?? "", index: m.index ?? 0, groups });
    }
  }
  return { matches };
}

export function runTestCases(
  pattern: string,
  flags: string,
  cases: Array<{ input: string; expectedMatches: number | null }>,
): TestCaseResult[] {
  return cases.map((tc) => {
    const { matches, error } = runRegex(pattern, flags, tc.input);
    const actualMatches = matches.length;
    const passed = error ? false : tc.expectedMatches === null ? true : actualMatches === tc.expectedMatches;
    return { input: tc.input, expectedMatches: tc.expectedMatches, actualMatches, passed, matches, error };
  });
}

// ---- Highlight renderer (returns segments for UI) ----

export type HighlightSegment = { text: string; matchIndex: number | null };

export function highlightMatches(input: string, matches: MatchResult[]): HighlightSegment[] {
  if (matches.length === 0) return [{ text: input, matchIndex: null }];
  const segments: HighlightSegment[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.index > cursor) {
      segments.push({ text: input.slice(cursor, m.index), matchIndex: null });
    }
    segments.push({ text: m.match, matchIndex: i });
    cursor = m.index + m.match.length;
  });
  if (cursor < input.length) {
    segments.push({ text: input.slice(cursor), matchIndex: null });
  }
  return segments;
}
