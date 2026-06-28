"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  app: string;
  title: string;
  body?: string | null;
  href?: string | null;
  level: "info" | "success" | "warn" | "error";
  readAt: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const LEVEL_COLOR: Record<NotificationItem["level"], string> = {
  info: "#7dd3fc",
  success: "#86efac",
  warn: "#fcd34d",
  error: "#fca5a5",
};

/**
 * In-app notification bell with a dropdown list. Polls /api/notifications every
 * 60s while mounted. Marking read is best-effort (fire-and-forget); UI updates
 * optimistically. Designed to live in the dashboard top bar of every app.
 */
export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { notifications: NotificationItem[] };
      setItems(json.notifications ?? []);
    } catch {
      /* ignore — bell just stays empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = items.filter((n) => !n.readAt).length;

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
    fetch("/api/notifications/read-all", { method: "POST" }).catch(() => {});
  }

  async function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
    fetch(`/api/notifications/${id}/read`, { method: "PATCH" }).catch(() => {});
  }

  return (
    <div className="ms-notif" ref={ref}>
      <button
        type="button"
        className="ms-notif-bell"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        {unread > 0 && <span className="ms-notif-badge">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="ms-notif-panel" role="dialog" aria-label="Notifications">
          <div className="ms-notif-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button type="button" className="ms-notif-markall" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="ms-notif-list">
            {loading ? (
              <div className="ms-notif-empty">Loading…</div>
            ) : items.length === 0 ? (
              <div className="ms-notif-empty">You&apos;re all caught up.</div>
            ) : (
              items.slice(0, 30).map((n) => {
                const content = (
                  <div className={cn("ms-notif-item", !n.readAt && "ms-notif-item-unread")}>
                    <span className="ms-notif-dot" style={{ background: LEVEL_COLOR[n.level] }} />
                    <div className="ms-notif-body">
                      <div className="ms-notif-title">{n.title}</div>
                      {n.body && <div className="ms-notif-text">{n.body}</div>}
                      <div className="ms-notif-meta">
                        <span>{n.app}</span>
                        <span>·</span>
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                    {!n.readAt && (
                      <button
                        type="button"
                        className="ms-notif-read"
                        aria-label="Mark read"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          markRead(n.id);
                        }}
                      />
                    )}
                  </div>
                );
                if (n.href) {
                  return (
                    <a key={n.id} href={n.href} className="ms-notif-link" onClick={() => markRead(n.id)}>
                      {content}
                    </a>
                  );
                }
                return <div key={n.id}>{content}</div>;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
