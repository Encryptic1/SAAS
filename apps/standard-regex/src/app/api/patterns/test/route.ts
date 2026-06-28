import { NextResponse } from "next/server";
import { explainRegex, runRegex, runTestCases, highlightMatches } from "@/lib/regex-engine";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    pattern?: string;
    flags?: string;
    input?: string;
    testCases?: Array<{ input: string; expectedMatches: number | null }>;
  };

  if (!body.pattern) return NextResponse.json({ error: "pattern required" }, { status: 400 });
  const flags = body.flags ?? "g";

  const explanation = explainRegex(body.pattern);
  const singleInput = body.input ?? "";
  const { matches, error } = runRegex(body.pattern, flags, singleInput);
  const segments = highlightMatches(singleInput, matches);
  const testResults = body.testCases ? runTestCases(body.pattern, flags, body.testCases) : [];

  return NextResponse.json({
    pattern: body.pattern,
    flags,
    explanation,
    matches,
    segments,
    testResults,
    error,
  });
}
