import { App } from "@slack/bolt";
import { VercelReceiver, createHandler } from "@vercel/slack-bolt";
import { waitUntil } from "@vercel/functions";
import { getDbAsync, isLocalGatewayMode, postGateway } from "@market-standard/db";
import { polls, votes, workspaces } from "@market-standard/db/schema/polls";
import { and, eq } from "@market-standard/db/query";
import {
  listEnabledPrompts,
  renderStandupModal,
  saveResponse,
  type StandupPromptRow,
} from "@/lib/standup-bot";

let handler: ReturnType<typeof createHandler> | null = null;

async function persistPoll(params: {
  teamId: string;
  channelId: string;
  createdBy: string;
  question: string;
  options: string[];
}): Promise<string | null> {
  if (isLocalGatewayMode()) {
    const result = await postGateway<{ poll: { id: string } }>("/polls/slack-poll", params);
    return result.poll.id;
  }

  const db = await getDbAsync();
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.slackTeamId, params.teamId))
    .limit(1);

  if (!workspace) return null;

  const [poll] = await db
    .insert(polls)
    .values({
      workspaceId: workspace.id,
      channelId: params.channelId,
      question: params.question,
      options: params.options,
      createdBy: params.createdBy,
      isAnonymous: false,
    })
    .returning();

  return poll?.id ?? null;
}

async function persistVote(params: {
  pollId: string;
  slackUserId: string;
  optionIndex: number;
}): Promise<boolean> {
  if (isLocalGatewayMode()) {
    await postGateway("/polls/vote", params);
    return true;
  }

  const db = await getDbAsync();
  const [existing] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.pollId, params.pollId), eq(votes.slackUserId, params.slackUserId)))
    .limit(1);

  if (existing) {
    await db
      .update(votes)
      .set({ optionIndex: params.optionIndex, votedAt: new Date() })
      .where(eq(votes.id, existing.id));
    return true;
  }

  await db.insert(votes).values({
    pollId: params.pollId,
    slackUserId: params.slackUserId,
    optionIndex: params.optionIndex,
  });

  return true;
}

function getSlackHandler() {
  if (handler) return handler;

  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    throw new Error("SLACK_SIGNING_SECRET is required");
  }

  const receiver = new VercelReceiver({ signingSecret });

  const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret,
    receiver,
    deferInitialization: true,
  });

  app.command("/poll", async ({ ack, command, respond }) => {
    await ack();

    waitUntil(
      (async () => {
        const text = command.text?.trim();
        if (!text) {
          await respond({
            response_type: "ephemeral",
            text: "Usage: `/poll Question? | Option 1 | Option 2 | Option 3`",
          });
          return;
        }

        const parts = text.split("|").map((s) => s.trim());
        const question = parts[0];
        const options = parts.slice(1);

        if (!question || options.length < 2) {
          await respond({
            response_type: "ephemeral",
            text: "Provide a question and at least 2 options separated by `|`.",
          });
          return;
        }

        const pollId = await persistPoll({
          teamId: command.team_id,
          channelId: command.channel_id,
          createdBy: command.user_id,
          question,
          options,
        });

        const blocks = [
          {
            type: "section",
            text: { type: "mrkdwn", text: `*${question}*` },
          },
          ...options.map((opt, i) => ({
            type: "section",
            text: { type: "mrkdwn", text: `${i + 1}. ${opt}` },
            accessory: {
              type: "button",
              text: { type: "plain_text", text: "Vote" },
              action_id: pollId ? `vote_${pollId}_${i}` : `vote_${i}`,
              value: String(i),
            },
          })),
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "Powered by <https://polls.marketstandard.io|Market Standard> — <https://polls.marketstandard.io|Add to Slack>",
              },
            ],
          },
        ];

        await respond({
          response_type: "in_channel",
          blocks,
          text: question,
        });
      })(),
    );
  });

  app.action(/^vote_/, async ({ ack, action, body, respond }) => {
    await ack();

    if (action.type !== "button") return;

    waitUntil(
      (async () => {
        const button = action as { type: "button"; action_id: string; value?: string };
        const actionId = button.action_id;
        const segments = actionId.split("_");
        const pollId = segments.length >= 3 ? segments[1] : null;
        const optionIndex = pollId ? Number(segments[2]) : Number(button.value);
        const userId = body.user?.id;

        if (pollId && userId) {
          await persistVote({ pollId, slackUserId: userId, optionIndex });
        }

        await respond({
          response_type: "ephemeral",
          text: `You voted for option ${optionIndex + 1}. Vote recorded.`,
        });
      })(),
    );
  });

  // Standup: open modal when user clicks the "Open standup form" button
  app.action(/^standup_open_/, async ({ ack, action, body, client }) => {
    await ack();

    const actionId = (action as { action_id: string }).action_id;
    const promptId = actionId.replace("standup_open_", "");
    const prompts = await listEnabledPrompts();
    const prompt = prompts.find((p) => p.id === promptId);
    if (!prompt) return;

    const slackUserId = body.user?.id;
    if (!slackUserId) return;

    try {
      const triggerId = (body as { trigger_id?: string }).trigger_id;
      if (!triggerId) return;
      await client.views.open({
        trigger_id: triggerId,
        view: renderStandupModal(prompt as StandupPromptRow, slackUserId) as never,
      });
    } catch (err) {
      console.error("[standup] views.open failed:", err);
    }
  });

  // Standup: handle modal submission
  app.view(/^standup_submit_/, async ({ ack, view, body }) => {
    const promptId = (view as { callback_id: string }).callback_id.replace("standup_submit_", "");
    const metadata = JSON.parse((view as { private_metadata: string }).private_metadata ?? "{}") as {
      slackUserId: string;
    };
    const slackUserId = body.user?.id ?? metadata.slackUserId;

    const stateValues = (view as { state: { values: Record<string, Record<string, { value?: string }>> } }).state.values;
    const answers: string[] = [];
    let i = 0;
    while (`q_${i}` in stateValues) {
      const v = stateValues[`q_${i}`]?.[`answer_${i}`]?.value ?? "";
      answers.push(v.trim());
      i += 1;
    }

    if (answers.some((a) => !a)) {
      await ack({
        response_action: "errors",
        errors: { [`q_${answers.findIndex((a) => !a)}`]: "Please answer all questions." },
      } as never);
      return;
    }

    await ack();
    waitUntil(
      (async () => {
        await saveResponse({ promptId, slackUserId, answers });
      })(),
    );
  });

  handler = createHandler(app, receiver);
  return handler;
}

export async function POST(request: Request) {
  if (!process.env.SLACK_SIGNING_SECRET) {
    return new Response(JSON.stringify({ error: "Slack not configured" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }

  const slackHandler = getSlackHandler();
  return slackHandler(request);
}
