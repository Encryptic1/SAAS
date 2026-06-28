import { NextResponse } from "next/server";
import { getDbAsync } from "@market-standard/db";
import { stripeAccounts } from "@market-standard/db/schema/metrics";

const STRIPE_TOKEN_URL = "https://connect.stripe.com/oauth/token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`/?error=${encodeURIComponent(error)}`);
  }

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const clientSecret = process.env.STRIPE_SECRET_KEY;
  if (!clientSecret) {
    return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
  }

  const response = await fetch(STRIPE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_secret: clientSecret,
      code,
    }),
  });

  const data = (await response.json()) as {
    stripe_user_id?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
  };

  if (!data.stripe_user_id || !data.access_token) {
    return NextResponse.redirect(`/?error=${encodeURIComponent(data.error ?? "connect_failed")}`);
  }

  try {
    const db = await getDbAsync();
    await db
      .insert(stripeAccounts)
      .values({
        stripeAccountId: data.stripe_user_id,
        ownerId: data.stripe_user_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        plan: "free",
      })
      .onConflictDoUpdate({
        target: stripeAccounts.stripeAccountId,
        set: {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          connectedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[metrics] Failed to persist Stripe account:", err);
  }

  return NextResponse.redirect("/dashboard?connected=true");
}
