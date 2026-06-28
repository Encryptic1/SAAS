import { getOwnerId } from "@/lib/owner";
import { listSessions, updateSession } from "@/lib/workspace-data";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events log stream for a dev session.
 *
 * In local dev this streams a heartbeat + session metadata so the dashboard
 * log viewer can demonstrate the SSE wiring. A production deployment would
 * tail the session's log file (or pgstream) and forward lines as `log` events.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await getOwnerId();
  if (!ownerId) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const sessions = await listSessions(ownerId);
  const session = sessions.find((s) => s.id === id);
  if (!session) return new Response("Not found", { status: 404 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      send("log", { line: `[workspace] session ${session.label} (${session.id})` });
      send("log", { line: `[workspace] apps: ${session.apps || "(none)"}` });
      send("log", { line: `[workspace] status: ${session.status}` });

      if (session.status !== "running") {
        send("end", { reason: "session not running" });
        controller.close();
        return;
      }

      // Heartbeat loop — emits a status line every 2s until the session stops.
      let ticks = 0;
      const interval = setInterval(async () => {
        ticks += 1;
        try {
          const fresh = await listSessions(ownerId);
          const current = fresh.find((s) => s.id === id);
          if (!current || current.status !== "running") {
            send("end", { reason: "session stopped" });
            clearInterval(interval);
            controller.close();
            return;
          }
          send("log", { line: `[heartbeat] tick ${ticks} — ${new Date().toISOString()}` });
        } catch {
          // ignore transient errors
        }
      }, 2000);

      // Clean up if the client disconnects.
      _request.signal?.addEventListener("abort", () => {
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
    },
  });
}
