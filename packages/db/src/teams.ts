import {
  fetchGateway,
  postGateway,
  patchGateway,
  deleteGateway,
  getDbAsync,
  isLocalGatewayMode,
} from "./index";
import {
  teams,
  teamMembers,
  invitations,
  roles,
  type Team,
  type TeamMember,
  type Invitation,
} from "./schema/teams";
import { eq, and, lt } from "drizzle-orm";

export type TeamInput = { slug: string; name: string; ownerId: string };
export type InviteInput = {
  teamId: string;
  email: string;
  role?: string;
  invitedBy: string;
  ttlHours?: number;
};

export type TeamWithRole = Team & { role: string };

export type Role = "owner" | "admin" | "member" | "viewer";

const ROLE_RANK: Record<Role, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };

function rank(role: string): number {
  return ROLE_RANK[(role as Role) ?? "member"] ?? ROLE_RANK.member;
}

/** True if `actorRole` satisfies `minRole`. */
export function hasRole(actorRole: string, minRole: Role): boolean {
  return rank(actorRole) >= ROLE_RANK[minRole];
}

function ser(t: Team): Team {
  return { ...t, createdAt: t.createdAt };
}

export async function createTeam(input: TeamInput): Promise<TeamWithRole> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ team: TeamWithRole }>(`/teams`, input);
    return json.team;
  }
  const db = await getDbAsync();
  const [team] = await db.insert(teams).values({ slug: input.slug, name: input.name }).returning();
  if (!team) throw new Error("Failed to create team");
  // Creator becomes the owner member.
  await db.insert(teamMembers).values({
    teamId: team.id,
    ownerId: input.ownerId,
    role: "owner",
    acceptedAt: new Date(),
  });
  return { ...team, role: "owner" };
}

export async function listTeamsForOwner(ownerId: string): Promise<TeamWithRole[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ teams: TeamWithRole[] }>(
      `/teams?ownerId=${encodeURIComponent(ownerId)}`,
    );
    return json.teams;
  }
  const db = await getDbAsync();
  const rows = await db
    .select({ team: teams, member: teamMembers })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.ownerId, ownerId));
  return rows.map((r) => ({ ...r.team, role: r.member.role }));
}

export async function listMembers(teamId: string): Promise<TeamMember[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ members: TeamMember[] }>(
      `/teams/${teamId}/members`,
    );
    return json.members;
  }
  const db = await getDbAsync();
  return db.select().from(teamMembers).where(eq(teamMembers.teamId, teamId));
}

export async function updateMemberRole(
  teamId: string,
  memberId: string,
  role: Role,
  actorId: string,
): Promise<void> {
  // RBAC: only admins+ may change roles.
  const actor = await getMember(teamId, actorId);
  if (!actor || !hasRole(actor.role, "admin")) {
    throw new RbacError("Insufficient role to update members");
  }
  if (isLocalGatewayMode()) {
    await patchGateway<{ ok: boolean }>(`/teams/${teamId}/members/${memberId}`, { role });
    return;
  }
  const db = await getDbAsync();
  await db.update(teamMembers).set({ role }).where(eq(teamMembers.id, memberId));
}

export async function removeMember(
  teamId: string,
  memberId: string,
  actorId: string,
): Promise<void> {
  const actor = await getMember(teamId, actorId);
  if (!actor || !hasRole(actor.role, "admin")) {
    throw new RbacError("Insufficient role to remove members");
  }
  if (isLocalGatewayMode()) {
    await deleteGateway<{ ok: boolean }>(`/teams/${teamId}/members/${memberId}`);
    return;
  }
  const db = await getDbAsync();
  await db.delete(teamMembers).where(and(eq(teamMembers.id, memberId), eq(teamMembers.teamId, teamId)));
}

export async function getMember(teamId: string, ownerId: string): Promise<TeamMember | null> {
  if (isLocalGatewayMode()) {
    try {
      const json = await fetchGateway<{ member: TeamMember | null }>(
        `/teams/${teamId}/member?ownerId=${encodeURIComponent(ownerId)}`,
      );
      return json.member;
    } catch {
      return null;
    }
  }
  const db = await getDbAsync();
  const [row] = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.ownerId, ownerId)))
    .limit(1);
  return row ?? null;
}

export async function createInvitation(input: InviteInput): Promise<Invitation> {
  const ttl = input.ttlHours ?? 168; // 7 days
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + ttl * 3600_000);
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ invitation: Invitation }>(`/teams/${input.teamId}/invitations`, {
      email: input.email,
      role: input.role ?? "member",
      invitedBy: input.invitedBy,
      token,
      expiresAt: expiresAt.toISOString(),
    });
    return json.invitation;
  }
  const db = await getDbAsync();
  const [inv] = await db
    .insert(invitations)
    .values({
      teamId: input.teamId,
      email: input.email,
      role: input.role ?? "member",
      token,
      invitedBy: input.invitedBy,
      expiresAt,
    })
    .returning();
  if (!inv) throw new Error("Failed to create invitation");
  return inv;
}

export async function listInvitations(teamId: string): Promise<Invitation[]> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ invitations: Invitation[] }>(
      `/teams/${teamId}/invitations`,
    );
    return json.invitations;
  }
  const db = await getDbAsync();
  return db.select().from(invitations).where(eq(invitations.teamId, teamId));
}

export async function acceptInvitation(token: string, ownerId: string): Promise<Invitation | null> {
  if (isLocalGatewayMode()) {
    const json = await postGateway<{ invitation: Invitation | null }>(`/teams/invitations/${token}/accept`, {
      ownerId,
    });
    return json.invitation;
  }
  const db = await getDbAsync();
  const [inv] = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  if (!inv) return null;
  if (inv.acceptedAt || inv.expiresAt < new Date()) return null;
  await db
    .update(invitations)
    .set({ acceptedAt: new Date(), acceptedBy: ownerId })
    .where(eq(invitations.id, inv.id));
  await db.insert(teamMembers).values({
    teamId: inv.teamId,
    ownerId,
    role: inv.role,
    acceptedAt: new Date(),
  });
  return { ...inv, acceptedAt: new Date(), acceptedBy: ownerId };
}

export async function listRoles(): Promise<Array<{ key: string; name: string }>> {
  if (isLocalGatewayMode()) {
    const json = await fetchGateway<{ roles: Array<{ key: string; name: string }> }>(`/teams/roles`);
    return json.roles;
  }
  const db = await getDbAsync();
  const rows = await db.select({ key: roles.key, name: roles.name }).from(roles);
  if (rows.length > 0) return rows;
  // Seed defaults if the table is empty.
  const defaults = [
    { key: "owner", name: "Owner" },
    { key: "admin", name: "Admin" },
    { key: "member", name: "Member" },
    { key: "viewer", name: "Viewer" },
  ];
  await db.insert(roles).values(defaults);
  return defaults;
}

/** Expire (delete) invitations past their expiry. Housekeeping helper. */
export async function purgeExpiredInvitations(): Promise<void> {
  if (isLocalGatewayMode()) return; // gateway handles its own purge
  const db = await getDbAsync();
  await db.delete(invitations).where(lt(invitations.expiresAt, new Date()));
}

export class RbacError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RbacError";
  }
}
