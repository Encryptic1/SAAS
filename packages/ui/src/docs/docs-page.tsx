import type { ReactNode } from "react";
import { DocsSearch } from "./docs-search";

export type DocsSection = {
  id: string;
  title: string;
  body: ReactNode;
};

export type ChangelogEntry = {
  version: string;
  date: string;
  notes: string[];
};

export type LoomVideo = {
  id: string;
  title: string;
  /** Loom share URL, e.g. https://www.loom.com/share/<id> */
  src: string;
};

export type DocsPageProps = {
  product: string;
  productName: string;
  tagline: string;
  sections: DocsSection[];
  changelog: ChangelogEntry[];
  /** Optional Loom walkthrough embeds rendered in a "Video walkthroughs" section. */
  loomVideos?: LoomVideo[];
};

/**
 * User documentation page rendered at /docs for each app. Pure server component
 * — no client interactivity. Sections + changelog are passed in by the per-app
 * page so content stays co-located with the app. Search is handled by the
 * client-side DocsSearch component (Pagefind).
 */
export function DocsPage({ product, productName, tagline, sections, changelog, loomVideos }: DocsPageProps) {
  return (
    <div className="ms-marketing ms-app ms-noise ms-docs">
      <header className="ms-docs-header">
        <div className="ms-docs-header-row">
          <a href="/" className="ms-docs-back">← {productName}</a>
          <a href="/api/docs" className="ms-docs-api-link">API reference →</a>
        </div>
        <h1 className="ms-docs-title">{productName} docs</h1>
        <p className="ms-docs-tagline">{tagline}</p>
        <DocsSearch />
      </header>

      <nav className="ms-docs-toc" aria-label="On this page">
        <ul>
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`}>{s.title}</a>
            </li>
          ))}
          {loomVideos && loomVideos.length > 0 && <li><a href="#walkthroughs">Video walkthroughs</a></li>}
          <li><a href="#changelog">Changelog</a></li>
        </ul>
      </nav>

      <main className="ms-docs-main">
        {sections.map((s) => (
          <section key={s.id} id={s.id} className="ms-docs-section">
            <h2>{s.title}</h2>
            <div className="ms-docs-body">{s.body}</div>
          </section>
        ))}

        {loomVideos && loomVideos.length > 0 && (
          <section id="walkthroughs" className="ms-docs-section">
            <h2>Video walkthroughs</h2>
            <div className="ms-docs-body">
              <div className="ms-docs-loom-grid">
                {loomVideos.map((v) => (
                  <figure key={v.id} className="ms-docs-loom">
                    <div className="ms-docs-loom-frame">
                      {v.src ? (
                        <iframe
                          src={`${v.src.replace(/\/$/, "")}?hideEmbedTopBar=true`}
                          title={v.title}
                          allowFullScreen
                          loading="lazy"
                        />
                      ) : (
                        <div className="ms-docs-loom-placeholder">Video coming soon</div>
                      )}
                    </div>
                    <figcaption>{v.title}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section id="changelog" className="ms-docs-section">
          <h2>Changelog</h2>
          <div className="ms-docs-body">
            {changelog.map((entry) => (
              <article key={entry.version} className="ms-docs-changelog-entry">
                <header>
                  <span className="ms-docs-version">{entry.version}</span>
                  <time className="ms-docs-date">{entry.date}</time>
                </header>
                <ul>
                  {entry.notes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="ms-docs-footer">
        <span>Market Standard · {productName}</span>
        <span>Product key: <code>{product}</code></span>
      </footer>
    </div>
  );
}
