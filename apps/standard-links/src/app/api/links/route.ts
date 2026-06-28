import { NextResponse } from "next/server";
import { getOwnerId, slugifyName } from "@/lib/owner";
import { createLink, listOwnerLinks } from "@/lib/links-data";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const links = await listOwnerLinks();
  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    name?: string;
    slug?: string;
    stripeUrl?: string;
    stripeLinkId?: string;
  };
  const name = body.name?.trim();
  const stripeUrl = body.stripeUrl?.trim();
  if (!name || !stripeUrl) {
    return NextResponse.json({ error: "name and stripeUrl required" }, { status: 400 });
  }
  if (!/^https?:\/\//.test(stripeUrl)) {
    return NextResponse.json({ error: "stripeUrl must be a valid URL" }, { status: 400 });
  }

  const slug = body.slug?.trim() || slugifyName(name) || `link-${Date.now()}`;
  try {
    const link = await createLink({
      ownerId,
      name,
      slug,
      stripeUrl,
      stripeLinkId: body.stripeLinkId,
    });
    if (!link) {
      return NextResponse.json({ error: "Create failed" }, { status: 500 });
    }
    return NextResponse.json({ link }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: "Slug already in use", detail: String(err) },
      { status: 409 },
    );
  }
}
