import { NextResponse } from "next/server";
import { renderEmbedHtml } from "@/lib/embed-html";
import { loadEmbedData } from "@/lib/load-embed-data";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await loadEmbedData(slug);

  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const html = renderEmbedHtml(data.collectionName, data.slug, data.items, data.showBadge);

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
