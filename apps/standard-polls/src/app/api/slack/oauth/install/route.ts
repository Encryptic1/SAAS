import { NextResponse } from "next/server";
import { getSlackOAuthUrl } from "@market-standard/auth";

export async function GET() {
  const state = crypto.randomUUID();
  const url = getSlackOAuthUrl(state);
  return NextResponse.redirect(url);
}
