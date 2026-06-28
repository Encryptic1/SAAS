import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Standard Workspace API — docs</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css" />
<style>body { margin: 0 } .topbar { display: none }</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js" crossorigin></script>
<script>
window.onload = () => {
  window.ui = SwaggerUIBundle({
    url: "/api/openapi.json",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis],
    layout: "BaseLayout",
    defaultModelsExpandDepth: -1,
  });
};
</script>
</body>
</html>`;

export async function GET() {
  return new NextResponse(HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}
