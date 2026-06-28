import { NextResponse } from "next/server";
import { recordClick } from "@/lib/links-data";

interface GoRouteProps {
  params: Promise<{ slug: string }>;
}

function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // Simple FNV-1a hash for privacy — we only need bucketing, not reversibility.
  let h = 0x811c9dc5;
  for (let i = 0; i < ip.length; i++) {
    h ^= ip.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
}

function parseUtm(url: URL): Record<string, string> {
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    const v = url.searchParams.get(key);
    if (v) utm[key] = v;
  }
  return utm;
}

export async function GET(request: Request, { params }: GoRouteProps) {
  const { slug } = await params;
  const url = new URL(request.url);
  const utm = parseUtm(url);

  let stripeUrl: string | null = null;
  try {
    stripeUrl = await recordClick(slug, {
      ipHash: hashIp(request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip")) ?? undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      referrer: request.headers.get("referer") ?? undefined,
      utm,
    });
  } catch {
    // Gateway returned 410 (inactive) or 404 (missing) — fall through to 404 below.
    stripeUrl = null;
  }

  if (!stripeUrl) {
    return new NextResponse(
      "This link is no longer active. Contact the owner if you believe this is an error.",
      { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } },
    );
  }

  // Forward UTM params to Stripe checkout for end-to-end attribution.
  const target = new URL(stripeUrl);
  for (const [k, v] of Object.entries(utm)) {
    if (!target.searchParams.has(k)) target.searchParams.set(k, v);
  }
  return NextResponse.redirect(target.toString(), { status: 302 });
}
