import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

type App = {
  dir: string;
  product: string;
  appKey: string;
  shell?: { import: string; component: string };
};

const APPS: App[] = [
  { dir: "standard-polls", product: "standard-polls", appKey: "standard-polls" },
  { dir: "standard-proof", product: "standard-proof", appKey: "standard-proof", shell: { import: "@/components/proof-dashboard-shell", component: "ProofDashboardShell" } },
  { dir: "standard-metrics", product: "standard-metrics", appKey: "standard-metrics" },
  { dir: "standard-hook", product: "standard-hook", appKey: "standard-hook", shell: { import: "@/components/hook-dashboard-shell", component: "HookDashboardShell" } },
  { dir: "standard-release", product: "standard-release", appKey: "standard-release", shell: { import: "@/components/release-dashboard-shell", component: "ReleaseDashboardShell" } },
  { dir: "standard-links", product: "standard-links", appKey: "standard-links", shell: { import: "@/components/links-dashboard-shell", component: "LinksDashboardShell" } },
  { dir: "standard-vault", product: "standard-vault", appKey: "standard-vault", shell: { import: "@/components/vault-dashboard-shell", component: "VaultDashboardShell" } },
  { dir: "standard-snippets", product: "standard-snippets", appKey: "standard-snippets", shell: { import: "@/components/snippets-dashboard-shell", component: "SnippetsDashboardShell" } },
  { dir: "standard-status", product: "standard-status", appKey: "standard-status", shell: { import: "@/components/status-dashboard-shell", component: "StatusDashboardShell" } },
  { dir: "standard-regex", product: "standard-regex", appKey: "standard-regex", shell: { import: "@/components/regex-dashboard-shell", component: "RegexDashboardShell" } },
  { dir: "standard-postmortem", product: "standard-postmortem", appKey: "standard-postmortem", shell: { import: "@/components/postmortem-dashboard-shell", component: "PostmortemDashboardShell" } },
  { dir: "standard-lens", product: "standard-lens", appKey: "standard-lens", shell: { import: "@/components/lens-dashboard-shell", component: "LensDashboardShell" } },
  { dir: "standard-cron", product: "standard-cron", appKey: "standard-cron", shell: { import: "@/components/cron-dashboard-shell", component: "CronDashboardShell" } },
];

const TEAM_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { createTeam, listTeamsForOwner, RbacError } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const teams = await listTeamsForOwner(ownerId);
  return NextResponse.json({ teams });
}

export async function POST(request: Request) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await request.json().catch(() => ({}))) as { name?: string; slug?: string };
  if (!body.name || !body.slug) return NextResponse.json({ error: "name, slug required" }, { status: 400 });
  try {
    const team = await createTeam({ name: body.name, slug: body.slug, ownerId });
    return NextResponse.json({ team }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 400 });
  }
}
`;

const MEMBERS_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { listMembers, getMember } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  // Only members of the team may list members.
  const actor = await getMember(teamId, ownerId);
  if (!actor) return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  const members = await listMembers(teamId);
  return NextResponse.json({ members });
}
`;

const MEMBER_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { updateMemberRole, removeMember, getMember, RbacError, type Role } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request, { params }: { params: Promise<{ teamId: string; memberId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId, memberId } = await params;
  const body = (await request.json().catch(() => ({}))) as { role?: string };
  if (!body.role) return NextResponse.json({ error: "role required" }, { status: 400 });
  try {
    await updateMemberRole(teamId, memberId, body.role as Role, ownerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RbacError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ teamId: string; memberId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId, memberId } = await params;
  // Prevent self-removal of owners.
  const target = await getMember(teamId, ownerId);
  if (target?.id === memberId && target.role === "owner") {
    return NextResponse.json({ error: "Owners cannot remove themselves" }, { status: 400 });
  }
  try {
    await removeMember(teamId, memberId, ownerId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof RbacError) return NextResponse.json({ error: err.message }, { status: 403 });
    return NextResponse.json({ error: "Failed" }, { status: 400 });
  }
}
`;

const INVITATIONS_ROUTE = `import { NextResponse } from "next/server";
import { getOwnerId } from "@market-standard/auth";
import { createInvitation, listInvitations, getMember, hasRole } from "@market-standard/db";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const actor = await getMember(teamId, ownerId);
  if (!actor) return NextResponse.json({ error: "Not a team member" }, { status: 403 });
  const invitations = await listInvitations(teamId);
  return NextResponse.json({ invitations });
}

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { teamId } = await params;
  const actor = await getMember(teamId, ownerId);
  if (!actor || !hasRole(actor.role, "admin")) {
    return NextResponse.json({ error: "Admin role required to invite" }, { status: 403 });
  }
  const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
  if (!body.email) return NextResponse.json({ error: "email required" }, { status: 400 });
  const invitation = await createInvitation({
    teamId,
    email: body.email,
    role: body.role ?? "member",
    invitedBy: ownerId,
  });
  return NextResponse.json({ invitation }, { status: 201 });
}
`;

function teamPage(app: App): string {
  const productPascal = app.product.replace(/-./g, (m) => m[1].toUpperCase());
  const productPascalCap = productPascal.charAt(0).toUpperCase() + productPascal.slice(1);
  if (app.shell) {
    return `import { ${app.shell.component} } from "${app.shell.import}";
import { TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <${app.shell.component}>
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="${app.appKey}" />
    </${app.shell.component}>
  );
}
`;
  }
  // polls + metrics use the shared shell directly.
  return `import { DashboardShell, TeamSettingsPanel, PageHeader } from "@market-standard/ui";

export default function TeamPage() {
  return (
    <DashboardShell product="${app.product}" productName="Standard ${productPascalCap}">
      <PageHeader title="Team" subtitle="Invite teammates and manage roles." />
      <TeamSettingsPanel appKey="${app.appKey}" />
    </DashboardShell>
  );
}
`;
}

async function ensureDir(path: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
}

async function writeIfChanged(path: string, content: string): Promise<boolean> {
  let prev: string | null = null;
  try {
    prev = await readFile(path, "utf8");
  } catch {
    /* missing */
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
    if (await writeIfChanged(join(base, "api", "team", "route.ts"), TEAM_ROUTE)) written++;
    if (await writeIfChanged(join(base, "api", "team", "[teamId]", "members", "route.ts"), MEMBERS_ROUTE))
      written++;
    if (
      await writeIfChanged(
        join(base, "api", "team", "[teamId]", "members", "[memberId]", "route.ts"),
        MEMBER_ROUTE,
      )
    )
      written++;
    if (await writeIfChanged(join(base, "api", "team", "[teamId]", "invitations", "route.ts"), INVITATIONS_ROUTE))
      written++;
    if (await writeIfChanged(join(base, "dashboard", "team", "page.tsx"), teamPage(app))) written++;
  }
  console.log(`Phase 8 teams wiring: wrote ${written} files across ${APPS.length} apps.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
