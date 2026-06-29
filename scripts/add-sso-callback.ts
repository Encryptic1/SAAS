/**
 * One-off: update all 14 apps' /auth/callback routes to try FloodG8 SSO
 * code redemption first, then fall back to standard OAuth exchangeCodeForSession.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const APPS = [
  "standard-polls",
  "standard-proof",
  "standard-metrics",
  "standard-hook",
  "standard-release",
  "standard-vault",
  "standard-links",
  "standard-snippets",
  "standard-status",
  "standard-regex",
  "standard-postmortem",
  "standard-lens",
  "standard-cron",
  "standard-workspace",
];

const NEW_CALLBACK = `import { NextResponse } from "next/server";
import { createSupabaseServerClient, redeemSsoCode } from "@market-standard/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // OAuth provider returned an explicit error
  if (error) {
    const reason = error.includes("expired") ? "expired" : "oauth";
    return NextResponse.redirect(\`\${origin}/auth/error?reason=\${reason}\`);
  }

  if (code) {
    // 1. Try FloodG8 SSO code redemption (shared.sso_codes bridge)
    const ssoResult = await redeemSsoCode(code);
    if (ssoResult.success) {
      return NextResponse.redirect(\`\${origin}\${next}\`);
    }
    // "code_not_found" means this isn't an SSO code — fall through to OAuth.

    // 2. Fall back to standard Supabase OAuth code exchange
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(\`\${origin}\${next}\`);
    }
    const reason = /expired|otp/i.test(error.message) ? "expired" : "invalid";
    return NextResponse.redirect(\`\${origin}/auth/error?reason=\${reason}\`);
  }

  // No code and no error — treat as invalid
  return NextResponse.redirect(\`\${origin}/auth/error?reason=invalid\`);
}
`;

let updated = 0;
let skipped = 0;

for (const app of APPS) {
  const filePath = path.join(ROOT, "apps", app, "src", "app", "auth", "callback", "route.ts");
  if (!fs.existsSync(filePath)) {
    console.log(`  SKIP  ${app} (no auth/callback route)`);
    skipped++;
    continue;
  }
  const old = fs.readFileSync(filePath, "utf8");
  if (old.includes("redeemSsoCode")) {
    console.log(`  SKIP  ${app} (already has SSO)`);
    skipped++;
    continue;
  }
  fs.writeFileSync(filePath, NEW_CALLBACK, "utf8");
  console.log(`  OK    ${app}`);
  updated++;
}

console.log(`\nUpdated: ${updated}, skipped: ${skipped}`);
