"use client";

import { useCallback, useEffect, useState } from "react";

type Member = {
  id: string;
  teamId: string;
  ownerId: string;
  role: string;
  acceptedAt: string | null;
  createdAt: string;
};

type Invitation = {
  id: string;
  teamId: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
};

type Team = { id: string; slug: string; name: string; role: string };

const ROLES: Array<{ key: string; label: string }> = [
  { key: "owner", label: "Owner" },
  { key: "admin", label: "Admin" },
  { key: "member", label: "Member" },
  { key: "viewer", label: "Viewer" },
];

/**
 * Team management panel: create a team, invite by email, change roles, remove
 * members, and revoke pending invitations. Talks to /api/team. The actor's
 * role is fetched first; admin+ actions are disabled for viewers/members.
 */
export function TeamSettingsPanel({ appKey }: { appKey: string }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [active, setActive] = useState<Team | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New-team form
  const [teamName, setTeamName] = useState("");
  const [teamSlug, setTeamSlug] = useState("");
  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const loadTeams = useCallback(async () => {
    try {
      const res = await fetch("/api/team", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { teams: Team[] };
      setTeams(json.teams ?? []);
      if (json.teams.length > 0 && !active) setActive(json.teams[0] ?? null);
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const loadDetail = useCallback(async (team: Team) => {
    setError(null);
    const [mRes, iRes] = await Promise.all([
      fetch(`/api/team/${team.id}/members`, { cache: "no-store" }),
      fetch(`/api/team/${team.id}/invitations`, { cache: "no-store" }),
    ]);
    if (mRes.ok) setMembers((await mRes.json()).members ?? []);
    if (iRes.ok) setInvitations((await iRes.json()).invitations ?? []);
  }, []);

  useEffect(() => {
    if (active) loadDetail(active);
    else {
      setMembers([]);
      setInvitations([]);
    }
  }, [active, loadDetail]);

  const canManage = active ? ["owner", "admin"].includes(active.role) : false;

  async function createTeam(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !teamSlug.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: teamName.trim(), slug: teamSlug.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create team");
      setTeamName("");
      setTeamSlug("");
      await loadTeams();
      setActive(json.team);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!active || !inviteEmail.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/${active.id}/invitations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to invite");
      setInviteEmail("");
      await loadDetail(active);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function changeRole(member: Member, role: string) {
    if (!active) return;
    setBusy(true);
    try {
      await fetch(`/api/team/${active.id}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      await loadDetail(active);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member: Member) {
    if (!active) return;
    setBusy(true);
    try {
      await fetch(`/api/team/${active.id}/members/${member.id}`, { method: "DELETE" });
      await loadDetail(active);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="ms-team-loading">Loading team…</div>;

  return (
    <div className="ms-team">
      <div className="ms-team-section">
        <h2 className="ms-team-h2">Your teams</h2>
        {teams.length === 0 ? (
          <p className="ms-team-empty">You don&apos;t belong to a team yet. Create one below to start collaborating.</p>
        ) : (
          <div className="ms-team-chips">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`ms-team-chip${active?.id === t.id ? " ms-team-chip-active" : ""}`}
                onClick={() => setActive(t)}
              >
                <span className="ms-team-chip-name">{t.name}</span>
                <span className="ms-team-chip-role">{t.role}</span>
              </button>
            ))}
          </div>
        )}

        <form className="ms-team-form" onSubmit={createTeam}>
          <input
            className="ms-input"
            placeholder="Team name"
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            disabled={busy}
          />
          <input
            className="ms-input"
            placeholder="slug"
            value={teamSlug}
            onChange={(e) => setTeamSlug(e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())}
            disabled={busy}
          />
          <button type="submit" className="ms-team-btn" disabled={busy || !teamName.trim() || !teamSlug.trim()}>
            Create team
          </button>
        </form>
      </div>

      {active && (
        <div className="ms-team-section">
          <h2 className="ms-team-h2">
            {active.name} <span className="ms-team-h2-sub">/{active.slug}</span>
          </h2>

          <h3 className="ms-team-h3">Members ({members.length})</h3>
          <div className="ms-team-list">
            {members.map((m) => (
              <div key={m.id} className="ms-team-row">
                <div className="ms-team-row-id">
                  <span className="ms-team-row-owner">{m.ownerId === "local-dev" ? "You (local dev)" : m.ownerId}</span>
                  <span className="ms-team-row-meta">{m.role}</span>
                </div>
                <div className="ms-team-row-actions">
                  <select
                    className="ms-input ms-team-select"
                    value={m.role}
                    disabled={!canManage || m.role === "owner" || busy}
                    onChange={(e) => changeRole(m, e.target.value)}
                  >
                    {ROLES.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                  {canManage && m.role !== "owner" && (
                    <button
                      type="button"
                      className="ms-team-btn ms-team-btn-ghost"
                      disabled={busy}
                      onClick={() => removeMember(m)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 className="ms-team-h3">Invite ({invitations.filter((i) => !i.acceptedAt).length} pending)</h3>
          {canManage ? (
            <form className="ms-team-form" onSubmit={invite}>
              <input
                className="ms-input"
                type="email"
                placeholder="teammate@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                disabled={busy}
              />
              <select
                className="ms-input ms-team-select"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                disabled={busy}
              >
                {ROLES.filter((r) => r.key !== "owner").map((r) => (
                  <option key={r.key} value={r.key}>
                    {r.label}
                  </option>
                ))}
              </select>
              <button type="submit" className="ms-team-btn" disabled={busy || !inviteEmail.trim()}>
                Send invite
              </button>
            </form>
          ) : (
            <p className="ms-team-empty">Only admins and owners can invite members.</p>
          )}

          {invitations.filter((i) => !i.acceptedAt).length > 0 && (
            <div className="ms-team-list">
              {invitations
                .filter((i) => !i.acceptedAt)
                .map((i) => (
                  <div key={i.id} className="ms-team-row">
                    <div className="ms-team-row-id">
                      <span className="ms-team-row-owner">{i.email}</span>
                      <span className="ms-team-row-meta">
                        {i.role} · expires {new Date(i.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {error && <div className="ms-team-error">{error}</div>}
        </div>
      )}
      <input type="hidden" value={appKey} readOnly />
    </div>
  );
}
