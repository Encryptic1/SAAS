import { fetchGateway, getDbAsync, isLocalGatewayMode } from "@market-standard/db";
import { polls, votes, workspaces } from "@market-standard/db/schema/polls";
import { standupPrompts } from "@market-standard/db/schema/standup";
import { kpiEvents } from "@market-standard/db/schema/shared";
import { count, desc, eq, sql } from "@market-standard/db/query";

export interface PollRow extends Record<string, unknown> {
  id: string;
  question: string;
  options: string[];
  channelId: string;
  createdAt: Date;
  workspaceName: string | null;
  voteCount: number;
}

export async function loadPollsList(): Promise<PollRow[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<PollRow[]>("/polls/list");
  }

  const db = await getDbAsync();
  const rows = await db
    .select({
      id: polls.id,
      question: polls.question,
      options: polls.options,
      channelId: polls.channelId,
      createdAt: polls.createdAt,
      workspaceName: workspaces.slackTeamName,
    })
    .from(polls)
    .leftJoin(workspaces, eq(polls.workspaceId, workspaces.id))
    .orderBy(desc(polls.createdAt))
    .limit(50);

  const withVotes = await Promise.all(
    rows.map(async (row) => {
      const [vc] = await db.select({ count: count() }).from(votes).where(eq(votes.pollId, row.id));
      return { ...row, voteCount: vc?.count ?? 0 };
    }),
  );

  return withVotes;
}

export async function loadPollsOverview() {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ workspaces: number; polls: number; votes: number }>("/polls/stats");
  }

  const db = await getDbAsync();
  const [ws] = await db.select({ count: count() }).from(workspaces);
  const [ps] = await db.select({ count: count() }).from(polls);
  const [vs] = await db.select({ count: count() }).from(votes);
  return { workspaces: ws?.count ?? 0, polls: ps?.count ?? 0, votes: vs?.count ?? 0 };
}

export async function loadPollsAnalytics() {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ events: Array<{ event: string; count: number }>; topPolls: PollRow[] }>(
      "/polls/analytics",
    );
  }

  const db = await getDbAsync();
  const events = await db
    .select({ event: kpiEvents.event, count: count() })
    .from(kpiEvents)
    .where(eq(kpiEvents.product, "standard-polls"))
    .groupBy(kpiEvents.event);

  const topPolls = await loadPollsList();
  return { events, topPolls: topPolls.slice(0, 5) };
}

export interface StandupPromptRow {
  id: string;
  channelId: string;
  scheduleCron: string;
  questions: string[];
  enabled: boolean;
}

export async function loadStandupPrompts(): Promise<StandupPromptRow[]> {
  if (isLocalGatewayMode()) {
    return fetchGateway<StandupPromptRow[]>("/polls/standup/prompts");
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) return [];

  return db
    .select({
      id: standupPrompts.id,
      channelId: standupPrompts.channelId,
      scheduleCron: standupPrompts.scheduleCron,
      questions: standupPrompts.questions,
      enabled: standupPrompts.enabled,
    })
    .from(standupPrompts)
    .where(eq(standupPrompts.workspaceId, workspace.id))
    .orderBy(desc(standupPrompts.createdAt));
}

export async function loadWorkspaceSettings() {
  if (isLocalGatewayMode()) {
    return fetchGateway<{ showBadge: boolean; plan: string; slackTeamName: string | null }>(
      "/polls/workspace",
    );
  }

  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) {
    return { showBadge: true, plan: "free", slackTeamName: null };
  }

  return {
    showBadge: workspace.showBadge,
    plan: workspace.plan,
    slackTeamName: workspace.slackTeamName,
  };
}

export async function countPollsThisMonth(): Promise<number> {
  if (isLocalGatewayMode()) {
    const stats = await loadPollsOverview();
    return stats.polls;
  }

  const db = await getDbAsync();
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const [row] = await db
    .select({ count: count() })
    .from(polls)
    .where(sql`${polls.createdAt} >= ${start}`);

  return row?.count ?? 0;
}
