import { NextResponse } from "next/server";
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
    return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
  }

  if (code) {
    // 1. Try FloodG8 SSO code redemption (shared.sso_codes bridge)
    const ssoResult = await redeemSsoCode(code);
    if (ssoResult.success) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    // "code_not_found" means this isn't an SSO code — fall through to OAuth.

    // 2. Fall back to standard Supabase OAuth code exchange
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const reason = /expired|otp/i.test(error.message) ? "expired" : "invalid";
    return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
  }

  // No code and no error — treat as invalid
  return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
}
