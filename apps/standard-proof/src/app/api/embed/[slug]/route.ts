import { NextResponse } from "next/server";
import { normalizeEmbedSlug } from "@/lib/embed-html";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug: rawSlug } = await params;
  const slug = normalizeEmbedSlug(rawSlug);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://proof.marketstandard.io";

  const script = `
(function() {
  var containers = document.querySelectorAll('[data-proof-collection="${slug}"]');
  containers.forEach(function(el) {
    var iframe = document.createElement('iframe');
    iframe.src = '${appUrl}/embed/${slug}';
    iframe.style.cssText = 'width:100%;border:none;min-height:200px;';
    iframe.loading = 'lazy';
    el.appendChild(iframe);
  });
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
