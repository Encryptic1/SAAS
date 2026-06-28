"use client";

import { useEffect, useState } from "react";

type TourStep = {
  title: string;
  detail: string;
  href?: string;
};

const STORAGE_KEY = "mktstd:tour-dismissed";

/**
 * Dismissible first-run banner shown above dashboard content. Tracks dismissal
 * in localStorage per browser, so it only reappears after the user clears
 * storage. Renders nothing on the server to avoid hydration mismatches.
 */
export function FirstRunTour({ appKey, steps }: { appKey: string; steps: TourStep[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(`${STORAGE_KEY}:${appKey}`);
    if (!dismissed) setVisible(true);
  }, [appKey]);

  function dismiss() {
    localStorage.setItem(`${STORAGE_KEY}:${appKey}`, "1");
    setVisible(false);
  }

  if (!visible || steps.length === 0) return null;

  return (
    <div className="ms-tour" role="region" aria-label="Getting started">
      <div className="ms-tour-head">
        <div>
          <div className="ms-tour-eyebrow">Getting started</div>
          <div className="ms-tour-title">A quick tour to get you rolling</div>
        </div>
        <button type="button" className="ms-tour-dismiss" aria-label="Dismiss tour" onClick={dismiss}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <ol className="ms-tour-steps">
        {steps.map((s, i) => (
          <li key={i} className="ms-tour-step">
            <span className="ms-tour-num">{i + 1}</span>
            <div>
              <div className="ms-tour-step-title">{s.title}</div>
              <div className="ms-tour-step-detail">{s.detail}</div>
            </div>
            {s.href && (
              <a className="ms-tour-step-link" href={s.href}>
                Open →
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
