"use client";

import { useEffect, useRef, useState } from "react";

type PagefindResult = {
  id: string;
  data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }>;
  score: number;
};

type PagefindModule = {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
};

/**
 * Client-side docs search powered by Pagefind. The Pagefind index is generated
 * post-build by `pnpm docs:index` (npx pagefind --site .next/server/app). In dev
 * mode the index is absent, so the input renders disabled with a hint.
 */
export function DocsSearch() {
  const inputRef = useRef<HTMLInputElement>(null);
  const pagefindRef = useRef<PagefindModule | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Array<{ url: string; title: string; excerpt: string }>>([]);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Non-literal specifier so TypeScript does not try to resolve the module
        // (the Pagefind index is generated post-build and is absent in dev).
        const specifier = "/_pagefind/pagefind.js";
        const mod = (await import(/* @vite-ignore */ specifier)) as PagefindModule;
        if (cancelled) return;
        pagefindRef.current = mod;
        setAvailable(true);
      } catch {
        if (cancelled) return;
        setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (!q || !pagefindRef.current) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { results: hits } = await pagefindRef.current!.search(q);
      if (cancelled) return;
      const top = hits.slice(0, 8);
      const enriched = await Promise.all(
        top.map(async (r) => {
          const d = await r.data();
          return { url: d.url, title: d.meta.title ?? d.url, excerpt: d.excerpt };
        }),
      );
      if (cancelled) return;
      setResults(enriched);
    })();
    return () => {
      cancelled = true;
    };
  }, [query]);

  return (
    <div className="ms-docs-search" aria-label="Search docs">
      <input
        ref={inputRef}
        type="search"
        placeholder={available === false ? "Search available after build" : "Search docs…"}
        disabled={available === false}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search docs"
      />
      {results.length > 0 && (
        <ul className="ms-docs-search-results" role="listbox">
          {results.map((r) => (
            <li key={r.url} role="option">
              <a href={r.url}>
                <span className="ms-docs-search-title">{r.title}</span>
                <span className="ms-docs-search-excerpt" dangerouslySetInnerHTML={{ __html: r.excerpt }} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
