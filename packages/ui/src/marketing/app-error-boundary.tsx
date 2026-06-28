"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
  /** Optional product label rendered in the fallback UI. */
  productLabel?: string;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level error boundary for the Market Standard suite. Catches render
 * errors in the client tree and shows a recoverable fallback instead of a
 * blank page. Wired into each app's root layout alongside global-error.tsx
 * (which handles errors in the root layout itself).
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[AppErrorBoundary]", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    const label = this.props.productLabel ?? "Market Standard";
    return (
      <div
        role="alert"
        style={{
          minHeight: "60vh",
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
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{label} hit a snag</h1>
        <p style={{ color: "#a8b0c2", maxWidth: "32rem" }}>
          Something went wrong while rendering this page. Try reloading — your data is safe.
        </p>
        <button
          type="button"
          onClick={() => this.setState({ error: null })}
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
          <pre
            style={{
              maxWidth: "40rem",
              overflow: "auto",
              fontSize: "0.75rem",
              color: "#ff4d6d",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.message}
          </pre>
        )}
      </div>
    );
  }
}
