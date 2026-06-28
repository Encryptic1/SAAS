"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { cn } from "../lib/utils";

export interface CommandItem {
  id: string;
  label: string;
  /** Optional grouping — e.g. "Navigate", "Apps", "Actions". */
  group?: string;
  /** Optional hint rendered on the right — e.g. "↵" or "Open". */
  hint?: string;
  /** Keyword string used for filtering (defaults to label). */
  keywords?: string;
  icon?: ReactNode;
  /** Called when the item is selected. If `href` is set, that takes precedence. */
  onSelect?: () => void;
  /** Navigate to this URL when selected. */
  href?: string;
}

export interface CommandPaletteProps {
  commands: Array<CommandItem>;
  /** Render the trigger button. Defaults to a ⌘K hint button. */
  trigger?: ReactNode;
}

export function CommandPalette({ commands, trigger }: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isModK) {
        e.preventDefault();
        setOpen((prev) => {
          if (!prev) {
            setQuery("");
            setActiveIndex(0);
          }
          return !prev;
        });
        return;
      }
      if (e.key === "Escape" && open) {
        closePalette();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closePalette]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const haystack = `${c.label} ${c.group ?? ""} ${c.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const g = item.group ?? "Commands";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-idx="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function handleSelect(item: CommandItem) {
    closePalette();
    if (item.href) {
      router.push(item.href);
    } else if (item.onSelect) {
      item.onSelect();
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) handleSelect(item);
    }
  }

  const triggerNode =
    trigger ?? (
      <button type="button" className="ms-dash-cp-hint" aria-label="Open command palette (⌘K)" onClick={openPalette}>
        <span className="ms-dash-cp-hint-text">Quick switch</span>
        <kbd className="ms-dash-kbd">⌘K</kbd>
      </button>
    );

  return (
    <>
      <span onClick={openPalette}>{triggerNode}</span>
      {open && (
        <div
          className="ms-dash-cp-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          onClick={(e) => {
            if (e.target === e.currentTarget) closePalette();
          }}
        >
          <div className="ms-dash-cp">
            <div className="ms-dash-cp-input-wrap">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="ms-dash-cp-input-icon" aria-hidden>
                <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search apps, pages, actions…"
                className="ms-dash-cp-input"
                aria-label="Search commands"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="ms-dash-kbd ms-dash-kbd-esc">esc</kbd>
            </div>
            <div ref={listRef} className="ms-dash-cp-list">
              {grouped.length === 0 ? (
                <div className="ms-dash-cp-empty">
                  <p>No matches for &ldquo;{query}&rdquo;</p>
                </div>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="ms-dash-cp-group">
                    <p className="ms-dash-cp-group-label">{group}</p>
                    {items.map((item) => {
                      const idx = filtered.indexOf(item);
                      const active = idx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-cmd-idx={idx}
                          className={cn("ms-dash-cp-item", active && "ms-dash-cp-item-active")}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => handleSelect(item)}
                          aria-current={active ? "true" : undefined}
                        >
                          <span className="ms-dash-cp-item-icon" aria-hidden>
                            {item.icon ?? <span className="ms-dash-cp-item-icon-default" />}
                          </span>
                          <span className="ms-dash-cp-item-label">{item.label}</span>
                          {item.hint && <span className="ms-dash-cp-item-hint">{item.hint}</span>}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            <div className="ms-dash-cp-foot">
              <span className="ms-dash-cp-foot-hint">
                <kbd className="ms-dash-kbd">↑</kbd>
                <kbd className="ms-dash-kbd">↓</kbd>
                to navigate
              </span>
              <span className="ms-dash-cp-foot-hint">
                <kbd className="ms-dash-kbd">↵</kbd>
                to select
              </span>
              <span className="ms-dash-cp-foot-brand">Market Standard</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
