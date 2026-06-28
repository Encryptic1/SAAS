import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@market-standard/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    const reason = error.includes("expired") ? "expired" : "oauth";
    return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    const reason = /expired|otp/i.test(error.message) ? "expired" : "invalid";
    return NextResponse.redirect(`${origin}/auth/error?reason=${reason}`);
  }

  return NextResponse.redirect(`${origin}/auth/error?reason=invalid`);
}
