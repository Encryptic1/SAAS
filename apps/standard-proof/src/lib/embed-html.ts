export interface EmbedTestimonial {
  authorName: string;
  authorTitle: string | null;
  content: string;
  rating: number | null;
}

export function normalizeEmbedSlug(slug: string): string {
  return slug.replace(/\.js$/, "");
}

export function renderEmbedHtml(
  collectionName: string,
  slug: string,
  items: EmbedTestimonial[],
  showBadge = true,
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://proof.marketstandard.io";
  const quotes = items
    .map(
      (t) => `
    <div class="testimonial">
      <p>&ldquo;${escapeHtml(t.content)}&rdquo;</p>
      <small>— ${escapeHtml(t.authorName)}${t.authorTitle ? `, ${escapeHtml(t.authorTitle)}` : ""}${t.rating ? ` · ${"★".repeat(t.rating)}` : ""}</small>
    </div>`,
    )
    .join("");

  const badgeHtml = showBadge
    ? `<div class="badge">
      <a href="${escapeHtml(appUrl)}" target="_blank" rel="noopener">Powered by Market Standard</a>
    </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(collectionName)}</title>
  <style>
    body { font-family: "Inter", system-ui, sans-serif; margin: 0; padding: 16px; background: #08080c; color: #fff; }
    .testimonial { background: linear-gradient(180deg, rgba(20, 20, 30, 0.6), rgba(14, 14, 20, 0.85)); border-radius: 10px; padding: 16px; margin-bottom: 12px; border: 1px solid #1f1f2e; }
    .testimonial p { margin: 0 0 8px; color: #ffffff; line-height: 1.6; }
    .testimonial small { color: #a8b0c2; }
    .badge { margin-top: 16px; padding-top: 12px; border-top: 1px solid #1f1f2e; font-size: 12px; }
    .badge a { color: #39ff14; text-decoration: none; }
    h1 { font-size: 1.125rem; margin: 0 0 12px; color: #ffffff; font-weight: 800; }
  </style>
</head>
<body>
  <h1>${escapeHtml(collectionName)}</h1>
  <div id="proof-widget" data-collection="${escapeHtml(slug)}">
    ${quotes || '<p class="testimonial">No testimonials yet.</p>'}
    ${badgeHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
