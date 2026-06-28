"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("[global-error]", error);
    }
  }, [error]);

  return (
    <html lang="en" data-theme="market-standard">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
          background: "#08080c",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Standard Hook hit a snag</h1>
        <p style={{ color: "#a8b0c2", maxWidth: "32rem" }}>
          An unexpected error occurred. Your data is safe — try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: "0.6rem 1.1rem",
            borderRadius: 6,
            border: "1px solid #39ff14",
            background: "rgba(57,255,20,0.12)",
            color: "#39ff14",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Try again
        </button>
        {process.env.NODE_ENV === "development" && (
          <pre style={{ maxWidth: "40rem", overflow: "auto", fontSize: "0.75rem", color: "#ff4d6d", whiteSpace: "pre-wrap" }}>
            {error.message}
          </pre>
        )}
      </body>
    </html>
  );
}
