"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@market-standard/ui";
import type { Session } from "@/lib/workspace-data";

export function SessionLogViewer({ session }: { session: Session }) {
  const [lines, setLines] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [stopped, setStopped] = useState(session.status !== "running");
  const containerRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (session.status !== "running") {
      setStopped(true);
      return;
    }
    const es = new EventSource(`/api/sessions/${session.id}/logs`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.addEventListener("log", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as { line?: string };
        if (data.line) setLines((prev) => [...prev.slice(-500), data.line as string]);
      } catch {
        // ignore malformed events
      }
    });
    es.addEventListener("end", () => {
      setStopped(true);
      es.close();
    });
    return () => es.close();
  }, [session.id, session.status]);

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = containerRef.current.scrollHeight;
  }, [lines]);

  async function stopSession() {
    const res = await fetch(`/api/sessions/${session.id}/stop`, { method: "POST" });
    if (res.ok) {
      setStopped(true);
      esRef.current?.close();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={stopped ? "neutral" : connected ? "success" : "warning"} dot>
            {stopped ? "stopped" : connected ? "live" : "connecting"}
          </Badge>
          <span className="font-medium">{session.label}</span>
          <span className="ms-app-muted text-xs">apps: {session.apps || "—"}</span>
        </div>
        {!stopped && (
          <button type="button" className="ms-btn-secondary text-xs" onClick={stopSession}>
            Stop session
          </button>
        )}
      </div>
      <div
        ref={containerRef}
        className="ms-card p-3 h-80 overflow-auto font-mono text-xs leading-relaxed bg-[#0b0b12]"
      >
        {lines.length === 0 ? (
          <p className="opacity-50">{stopped ? "Session ended. No logs captured." : "Waiting for logs…"}</p>
        ) : (
          lines.map((l, i) => (
            <div key={i} className="whitespace-pre-wrap break-all">{l}</div>
          ))
        )}
      </div>
    </div>
  );
}
