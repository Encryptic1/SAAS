import { fetchGateway, getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { standupPrompts, standupResponses } from "@market-standard/db/schema/standup";
import { workspaces } from "@market-standard/db/schema/polls";
import { and, desc, eq, gte } from "@market-standard/db/query";

export interface StandupPromptRow {
  id: string;
  channelId: string;
  scheduleCron: string;
  questions: string[];
  enabled: boolean;
}

export interface StandupResponseRow {
  id: string;
  promptId: string;
  slackUserId: string;
  answers: string[];
  submittedAt: Date;
}

export async function listEnabledPrompts(): Promise<StandupPromptRow[]> {
  if (isLocalGatewayMode()) {
    const rows = await fetchGateway<StandupPromptRow[]>("/polls/standup/prompts");
    return rows.filter((p) => p.enabled);
  }
  const db = await getDbAsync();
  const [workspace] = await db.select().from(workspaces).limit(1);
  if (!workspace) return [];
  const rows = await db
    .select()
    .from(standupPrompts)
    .where(and(eq(standupPrompts.workspaceId, workspace.id), eq(standupPrompts.enabled, true)));
  return rows.map((r) => ({
    id: r.id,
    channelId: r.channelId,
    scheduleCron: r.scheduleCron,
    questions: r.questions,
    enabled: r.enabled,
  }));
}

export async function listRecentResponses(promptId: string | null, days = 1): Promise<StandupResponseRow[]> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (isLocalGatewayMode()) {
    const url = `/polls/standup/responses?days=${days}${promptId ? `&promptId=${promptId}` : ""}`;
    const data = await fetchGateway<{ responses: StandupResponseRow[] }>(url);
    return data.responses.map((r) => ({ ...r, submittedAt: new Date(r.submittedAt) }));
  }
  const db = await getDbAsync();
  const conds = [gte(standupResponses.submittedAt, since)];
  if (promptId) conds.push(eq(standupResponses.promptId, promptId));
  const rows = await db
    .select()
    .from(standupResponses)
    .where(conds.length === 2 ? and(...conds) : conds[0])
    .orderBy(desc(standupResponses.submittedAt));
  return rows;
}

export async function saveResponse(input: {
  promptId: string;
  slackUserId: string;
  answers: string[];
}): Promise<StandupResponseRow | null> {
  if (isLocalGatewayMode()) {
    const data = await postGateway<{ response: StandupResponseRow }>("/polls/standup/responses", input);
    return data.response ? { ...data.response, submittedAt: new Date(data.response.submittedAt) } : null;
  }
  const db = await getDbAsync();
  const [row] = await db
    .insert(standupResponses)
    .values({
      promptId: input.promptId,
      slackUserId: input.slackUserId,
      answers: input.answers,
    })
    .returning();
  return row ?? null;
}

/**
 * Lightweight cron matcher supporting the subset of cron fields we use:
 *   5 fields: minute hour day-of-month month day-of-week
 * Day-of-week: 0-6 (Sun-Sat) plus ranges like 1-5 (Mon-Fri).
 * Honors star for any, star-slash-N for step, and N for exact match.
 */
export function cronMatchesNow(scheduleCron: string, now: Date = new Date()): boolean {
  const parts = scheduleCron.trim().split(/\s+/);
  if (parts.length !== 5) return false;
  const [minFieldRaw, hourFieldRaw, , , dowFieldRaw] = parts;
  const minField = minFieldRaw ?? "*";
  const hourField = hourFieldRaw ?? "*";
  const dowField = dowFieldRaw ?? "*";
  const min = now.getMinutes();
  const hour = now.getHours();
  const dow = now.getDay();

  function matches(field: string, value: number, max: number): boolean {
    if (field === "*") return true;
    if (field.startsWith("*/")) {
      const step = Number(field.slice(2));
      if (!step || step <= 0) return false;
      return value % step === 0;
    }
    for (const piece of field.split(",")) {
      const rangeMatch = piece.match(/^(\d+)-(\d+)$/);
      if (rangeMatch) {
        const a = Number(rangeMatch[1]);
        const b = Number(rangeMatch[2]);
        if (value >= Math.min(a, b) && value <= Math.max(a, b)) return true;
        continue;
      }
      if (piece === String(value)) return true;
    }
    void max;
    return false;
  }

  return matches(minField, min, 59) && matches(hourField, hour, 23) && matches(dowField, dow, 6);
}

const BLOCKER_KEYWORDS = [
  "blocked",
  "stuck",
  "blocker",
  "need help",
  "needs help",
  "waiting on",
  "waiting for",
  "can't proceed",
  "cannot proceed",
  "halted",
];

export interface BlockerHit {
  keyword: string;
  answerIndex: number;
  excerpt: string;
}

export function detectBlockers(answers: string[]): BlockerHit[] {
  const hits: BlockerHit[] = [];
  answers.forEach((a, i) => {
    const lower = a.toLowerCase();
    for (const kw of BLOCKER_KEYWORDS) {
      const idx = lower.indexOf(kw);
      if (idx >= 0) {
        const start = Math.max(0, idx - 20);
        const end = Math.min(a.length, idx + kw.length + 40);
        hits.push({ keyword: kw, answerIndex: i, excerpt: a.slice(start, end) });
        break;
      }
    }
  });
  return hits;
}

export function renderStandupDmBlocks(prompt: StandupPromptRow): unknown[] {
  return [
    {
      type: "header",
      text: { type: "plain_text", text: "Daily standup prompt" },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Time to share your update. Answer ${prompt.questions.length} question${prompt.questions.length === 1 ? "" : "s"} and the team digest will post to <#${prompt.channelId}>.`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open standup form" },
          action_id: `standup_open_${prompt.id}`,
          style: "primary",
        },
      ],
    },
    {
      type: "context",
      elements: [
        { type: "mrkdwn", text: "Powered by Market Standard Standup · `polls.marketstandard.io`" },
      ],
    },
  ];
}

export function renderStandupModal(prompt: StandupPromptRow, slackUserId: string): unknown {
  const blocks: unknown[] = prompt.questions.map((q, i) => ({
    type: "input",
    block_id: `q_${i}`,
    label: { type: "plain_text", text: q },
    element: {
      type: "plain_text_input",
      action_id: `answer_${i}`,
      multiline: true,
      placeholder: { type: "plain_text", text: "Type your answer…" },
    },
  }));

  return {
    type: "modal",
    callback_id: `standup_submit_${prompt.id}`,
    private_metadata: JSON.stringify({ promptId: prompt.id, slackUserId }),
    title: { type: "plain_text", text: "Standup" },
    submit: { type: "plain_text", text: "Submit" },
    close: { type: "plain_text", text: "Cancel" },
    blocks,
  };
}

export function renderDigestBlocks(
  prompt: StandupPromptRow,
  responses: StandupResponseRow[],
): unknown[] {
  const blockers = responses.flatMap((r) =>
    detectBlockers(r.answers).map((b) => ({ ...b, slackUserId: r.slackUserId })),
  );

  const blocks: unknown[] = [];
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: `Standup digest — ${responses.length} response${responses.length === 1 ? "" : "s"}` },
  });
  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: `Posted to <#${prompt.channelId}> · ${new Date().toLocaleString()}` },
    ],
  });

  if (blockers.length > 0) {
    const uniqueUsers = Array.from(new Set(blockers.map((b) => b.slackUserId)));
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:rotating_light: *${uniqueUsers.length} person${uniqueUsers.length === 1 ? "" : "s"} flagged blockers* — please review below.`,
      },
    });
    for (const b of blockers.slice(0, 8)) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*<@${b.slackUserId}>* — \`${b.keyword}\` in Q${b.answerIndex + 1}: _…${b.excerpt}…_`,
        },
      });
    }
    if (blockers.length > 8) {
      blocks.push({
        type: "context",
        elements: [{ type: "mrkdwn", text: `+${blockers.length - 8} more blocker(s)` }],
      });
    }
    blocks.push({ type: "divider" });
  }

  for (const r of responses) {
    const answerText = r.answers
      .map((a, i) => `*Q${i + 1}:* ${a}`)
      .join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `<@${r.slackUserId}>\n${answerText}` },
    });
    blocks.push({ type: "divider" });
  }

  blocks.push({
    type: "context",
    elements: [
      { type: "mrkdwn", text: "Composed by Market Standard Standup · `POST /api/cron/standup-digest`" },
    ],
  });

  return blocks;
}

export async function dmUserBlocks(
  slackUserId: string,
  blocks: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN not set" };
  const openRes = await fetch("https://slack.com/api/conversations.open", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ users: slackUserId }),
  });
  const openData = (await openRes.json()) as { ok: boolean; channel?: { id: string }; error?: string };
  if (!openData.ok || !openData.channel) {
    return { ok: false, error: openData.error ?? "conversations.open failed" };
  }
  const postRes = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: openData.channel.id, blocks }),
  });
  const postData = (await postRes.json()) as { ok: boolean; error?: string };
  return postData;
}

export async function postToChannel(
  channelId: string,
  blocks: unknown[],
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return { ok: false, error: "SLACK_BOT_TOKEN not set" };
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ channel: channelId, blocks }),
  });
  return (await res.json()) as { ok: boolean; error?: string };
}

export async function listWorkspaceMembers(): Promise<string[]> {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch("https://slack.com/api/users.list", {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5_000),
    });
    const data = (await res.json()) as {
      ok: boolean;
      members?: Array<{ id: string; is_bot?: boolean; deleted?: boolean }>;
    };
    if (!data.ok || !data.members) return [];
    return data.members
      .filter((m) => !m.is_bot && !m.deleted)
      .map((m) => m.id);
  } catch {
    return [];
  }
}

export async function runStandupPromptCron(): Promise<{
  promptsProcessed: number;
  dms: Array<{ slackUserId: string; ok: boolean; error?: string }>;
}> {
  const prompts = (await listEnabledPrompts()).filter((p) => cronMatchesNow(p.scheduleCron));
  const members = await listWorkspaceMembers();
  const dms: Array<{ slackUserId: string; ok: boolean; error?: string }> = [];

  for (const prompt of prompts) {
    const blocks = renderStandupDmBlocks(prompt);
    for (const userId of members) {
      const result = await dmUserBlocks(userId, blocks);
      dms.push({ slackUserId: userId, ok: result.ok, error: result.ok ? undefined : result.error });
    }
  }

  return { promptsProcessed: prompts.length, dms };
}

export async function runStandupDigestCron(): Promise<{
  digestsPosted: number;
  posts: Array<{ channelId: string; ok: boolean; error?: string }>;
}> {
  const prompts = await listEnabledPrompts();
  const posts: Array<{ channelId: string; ok: boolean; error?: string }> = [];

  for (const prompt of prompts) {
    const responses = await listRecentResponses(prompt.id, 1);
    if (responses.length === 0) continue;
    const blocks = renderDigestBlocks(prompt, responses);
    const result = await postToChannel(prompt.channelId, blocks);
    posts.push({
      channelId: prompt.channelId,
      ok: result.ok,
      error: result.ok ? undefined : result.error,
    });
  }

  return { digestsPosted: posts.filter((p) => p.ok).length, posts };
}
