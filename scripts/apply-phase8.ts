import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

type App = { dir: string; product: string; appKey: string };

const APPS: App[] = [
  { dir: "standard-polls", product: "Standard Polls", appKey: "standard-polls" },
  { dir: "standard-proof", product: "Standard Proof", appKey: "standard-proof" },
  { dir: "standard-metrics", product: "Standard Metrics", appKey: "standard-metrics" },
  { dir: "standard-hook", product: "Standard Hook", appKey: "standard-hook" },
  { dir: "standard-release", product: "Standard Release", appKey: "standard-release" },
  { dir: "standard-links", product: "Standard Links", appKey: "standard-links" },
  { dir: "standard-vault", product: "Standard Vault", appKey: "standard-vault" },
  { dir: "standard-snippets", product: "Standard Snippets", appKey: "standard-snippets" },
  { dir: "standard-status", product: "Standard Status", appKey: "standard-status" },
  { dir: "standard-regex", product: "Standard Regex", appKey: "standard-regex" },
  { dir: "standard-postmortem", product: "Standard Postmortem", appKey: "standard-postmortem" },
  { dir: "standard-lens", product: "Standard Lens", appKey: "standard-lens" },
  { dir: "standard-cron", product: "Standard Cron", appKey: "standard-cron" },
];

const NOTIF_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { listNotifications, createNotification, type NotificationInput } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await listNotifications(ownerId);
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as Partial<NotificationInput>;
  if (!body.title) return NextResponse.json({ error: "title required" }, { status: 400 });
  const notification = await createNotification({
    ownerId,
    app: "\${APP_KEY_PLACEHOLDER}",
    title: body.title,
    body: body.body,
    href: body.href,
    level: body.level,
  });
  return NextResponse.json({ notification }, { status: 201 });
}
`;

const NOTIF_READ_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { markNotificationRead } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await markNotificationRead(id);
  return NextResponse.json({ ok: true });
}
`;

const NOTIF_READ_ALL_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { markAllRead } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function POST() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await markAllRead(ownerId);
  return NextResponse.json({ ok: true });
}
`;

function authLoadingPage(product: string): string {
  return `import { AuthLoadingPage } from "@market-standard/ui";

export default function LoadingPage() {
  return <AuthLoadingPage productName="${product}" />;
}
`;
}

function authErrorPage(product: string): string {
  return `import { AuthErrorPage } from "@market-standard/ui";

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function ErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return <AuthErrorPage productName="${product}" reason={reason} />;
}
`;
}

const AUTH_CALLBACK = `import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@market-standard/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // OAuth provider returned an explicit error
  if (error) {
    const reason = error.includes("expired") ? "expired" : "oauth";
    return NextResponse.redirect(\`\${origin}/auth/error?reason=\${reason}\`);
  }

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(\`\${origin}\${next}\`);
    }
    const reason = /expired|otp/i.test(error.message) ? "expired" : "invalid";
    return NextResponse.redirect(\`\${origin}/auth/error?reason=\${reason}\`);
  }

  // No code and no error — treat as invalid
  return NextResponse.redirect(\`\${origin}/auth/error?reason=invalid\`);
}
`;

async function ensureDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  let prev: string | null = null;
  try {
    prev = await readFile(path, "utf8");
  } catch {
    /* file missing */
  }
  if (prev === content) return false;
  await ensureDir(path);
  await writeFile(path, content, "utf8");
  return true;
}

async function main() {
  let written = 0;
  for (const app of APPS) {
    const base = join("apps", app.dir, "src", "app");

    // Notifications API
    const notifRoute = NOTIF_ROUTE.replace(/\$\{APP_KEY_PLACEHOLDER\}/g, app.appKey);
    if (await writeIfChanged(join(base, "api", "notifications", "route.ts"), notifRoute)) written++;
    if (await writeIfChanged(join(base, "api", "notifications", "[id]", "read", "route.ts"), NOTIF_READ_ROUTE))
      written++;
    if (await writeIfChanged(join(base, "api", "notifications", "read-all", "route.ts"), NOTIF_READ_ALL_ROUTE))
      written++;

    // Auth status pages
    if (await writeIfChanged(join(base, "auth", "loading", "page.tsx"), authLoadingPage(app.product)))
      written++;
    if (await writeIfChanged(join(base, "auth", "error", "page.tsx"), authErrorPage(app.product)))
      written++;

    // Auth callback (rewritten to route errors to /auth/error)
    if (await writeIfChanged(join(base, "auth", "callback", "route.ts"), AUTH_CALLBACK)) written++;
  }
  console.log(`Phase 8 wiring: wrote ${written} files across ${APPS.length} apps.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
