import { RegexDashboardShell } from "@/components/regex-dashboard-shell";

export const dynamic = "force-dynamic";

const SECTIONS: Array<{ title: string; rows: Array<{ token: string; desc: string }> }> = [
  {
    title: "Anchors",
    rows: [
      { token: "^", desc: "Start of string (or line, with 'm' flag)" },
      { token: "$", desc: "End of string (or line, with 'm' flag)" },
      { token: "\\b", desc: "Word boundary — between a word char and a non-word char" },
      { token: "\\B", desc: "Non-word-boundary" },
    ],
  },
  {
    title: "Character classes",
    rows: [
      { token: "[abc]", desc: "Any one of a, b, or c" },
      { token: "[^abc]", desc: "Any character except a, b, c" },
      { token: "[a-z]", desc: "Any character in the range a–z" },
      { token: ".", desc: "Any character except newline (or any with 's' flag)" },
    ],
  },
  {
    title: "Shorthand",
    rows: [
      { token: "\\d", desc: "Digit [0-9]" },
      { token: "\\D", desc: "Non-digit" },
      { token: "\\w", desc: "Word char [A-Za-z0-9_]" },
      { token: "\\W", desc: "Non-word char" },
      { token: "\\s", desc: "Whitespace" },
      { token: "\\S", desc: "Non-whitespace" },
    ],
  },
  {
    title: "Quantifiers",
    rows: [
      { token: "*", desc: "Zero or more (greedy)" },
      { token: "+", desc: "One or more (greedy)" },
      { token: "?", desc: "Zero or one (optional)" },
      { token: "{n}", desc: "Exactly n times" },
      { token: "{n,}", desc: "At least n times" },
      { token: "{n,m}", desc: "Between n and m times" },
      { token: "*? +? ??", desc: "Lazy (non-greedy) variants" },
    ],
  },
  {
    title: "Groups & alternation",
    rows: [
      { token: "(...)", desc: "Capturing group" },
      { token: "(?:...)", desc: "Non-capturing group" },
      { token: "(?<name>...)", desc: "Named capturing group" },
      { token: "(?<=...)", desc: "Positive lookbehind" },
      { token: "(?<!...)", desc: "Negative lookbehind" },
      { token: "(?=...)", desc: "Positive lookahead" },
      { token: "(?!...)", desc: "Negative lookahead" },
      { token: "a|b", desc: "Alternation — match a or b" },
    ],
  },
  {
    title: "Flags",
    rows: [
      { token: "g", desc: "Global — find all matches" },
      { token: "i", desc: "Case-insensitive" },
      { token: "m", desc: "Multiline — ^ and $ match line boundaries" },
      { token: "s", desc: "Dotall — . matches newlines" },
      { token: "u", desc: "Unicode mode" },
      { token: "y", desc: "Sticky — match at lastIndex only" },
    ],
  },
  {
    title: "Escapes",
    rows: [
      { token: "\\\\.", desc: "Literal dot" },
      { token: "\\\\*", desc: "Literal asterisk" },
      { token: "\\\\(", desc: "Literal opening paren" },
      { token: "\\\\[", desc: "Literal opening bracket" },
      { token: "\\n", desc: "Newline" },
      { token: "\\t", desc: "Tab" },
      { token: "\\xHH", desc: "Hex escape (e.g. \\x41 = 'A')" },
    ],
  },
];

export default function CheatSheetPage() {
  return (
    <RegexDashboardShell>
      <div className="space-y-6 max-w-4xl">
        <header>
          <h1 className="text-2xl font-semibold">Regex cheat sheet</h1>
          <p className="text-sm ms-app-muted">
            An anchored reference for the constructs supported by the Standard Regex explanation engine.
          </p>
        </header>
        <div className="grid gap-5 md:grid-cols-2">
          {SECTIONS.map((s) => (
            <div key={s.title} className="ms-card p-4 space-y-2">
              <h2 className="text-sm font-semibold">{s.title}</h2>
              <div className="space-y-1.5">
                {s.rows.map((r) => (
                  <div key={r.token} className="flex items-start gap-3 text-xs">
                    <code className="ms-code shrink-0 min-w-[80px] text-right">{r.token}</code>
                    <span className="ms-app-muted">{r.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </RegexDashboardShell>
  );
}
