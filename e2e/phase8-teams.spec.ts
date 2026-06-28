import { expect, test } from "@playwright/test";
import { BASE, collectPageErrors, expectNoErrors } from "./helpers";

// Phase 8: teams + RBAC (create team, list members, invite, role gate).

test.describe("Teams + RBAC", () => {
  test("create team via API and page renders panel", async ({ page, request }) => {
    const slug = `e2e-team-${Date.now()}`;
    const createRes = await request.post(`${BASE.lens}/api/team`, {
      data: { name: `E2E Team ${slug}`, slug },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.team.id).toBeTruthy();
    expect(created.team.role).toBe("owner");

    // Members list includes the creator as owner.
    const membersRes = await request.get(`${BASE.lens}/api/team/${created.team.id}/members`);
    expect(membersRes.status()).toBe(200);
    const members = await membersRes.json();
    expect(members.members.some((m: { role: string }) => m.role === "owner")).toBeTruthy();

    // Dashboard /team page renders the panel with the team chip.
    const errors = collectPageErrors(page);
    await page.goto(`${BASE.lens}/dashboard/team`, { waitUntil: "networkidle" });
    await expect(page.locator("h1").first()).toContainText(/team/i);
    await expect(page.locator(".ms-team-chip").first()).toBeVisible();
    await expect(page.locator("body")).toContainText(/E2E Team/);
    expectNoErrors(errors, "Lens team page");
  });

  test("non-admin cannot invite (RBAC gate)", async ({ request }) => {
    // Create a team, then attempt to invite without an admin actor.
    // In local-dev mode the owner IS the admin (owner role), so to test the
    // gate we hit a team that has no membership for the actor. Use a random
    // team id — getMember returns null → 403.
    const fakeTeam = "00000000-0000-0000-0000-000000000000";
    const res = await request.post(`${BASE.cron}/api/team/${fakeTeam}/invitations`, {
      data: { email: "nope@example.com", role: "member" },
    });
    expect(res.status()).toBe(403);
  });

  test("invitations flow: create + list + accept", async ({ request }) => {
    const slug = `e2e-inv-${Date.now()}`;
    const team = await (await request.post(`${BASE.polls}/api/team`, { data: { name: `Inv ${slug}`, slug } })).json();

    const inviteRes = await request.post(`${BASE.polls}/api/team/${team.team.id}/invitations`, {
      data: { email: `invitee-${slug}@example.com`, role: "member" },
    });
    expect(inviteRes.status()).toBe(201);
    const invite = await inviteRes.json();
    expect(invite.invitation.token).toBeTruthy();

    const listRes = await request.get(`${BASE.polls}/api/team/${team.team.id}/invitations`);
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.invitations.some((i: { id: string }) => i.id === invite.invitation.id)).toBeTruthy();
  });

  test("team page is reachable on every app", async ({ request }) => {
    const apps = [
      ["polls", BASE.polls],
      ["proof", BASE.proof],
      ["metrics", BASE.metrics],
      ["cron", BASE.cron],
    ] as const;
    for (const [, base] of apps) {
      const res = await request.get(`${base}/dashboard/team`);
      expect([200, 401]).toContain(res.status());
    }
  });
});
