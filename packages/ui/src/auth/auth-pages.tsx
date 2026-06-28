import { LoginPage } from "../dashboard/login-page";

/**
 * Loading state shown while the magic-link / OAuth code exchange is in flight.
 * Rendered at /auth/loading. Pure presentational — no data fetching.
 */
export function AuthLoadingPage({ productName }: { productName: string }) {
  return (
    <div className="ms-marketing ms-app ms-noise ms-auth-page">
      <div className="ms-auth-card">
        <div className="ms-auth-brand">{productName}</div>
        <div className="ms-auth-spinner" aria-hidden="true" />
        <h1 className="ms-auth-title">Verifying your sign-in link…</h1>
        <p className="ms-auth-sub">Hang tight — we&apos;re finishing your sign-in.</p>
      </div>
    </div>
  );
}

type ErrorReason = "expired" | "invalid" | "oauth" | "unknown";

const ERROR_COPY: Record<ErrorReason, { title: string; sub: string }> = {
  expired: {
    title: "This sign-in link has expired",
    sub: "Magic links expire after 24 hours. Request a fresh one and we'll send you right in.",
  },
  invalid: {
    title: "That sign-in link isn't valid",
    sub: "The link looks malformed or has already been used. Try signing in again.",
  },
  oauth: {
    title: "Google sign-in didn't complete",
    sub: "Something interrupted the Google flow. You can try again or use a magic link instead.",
  },
  unknown: {
    title: "Sign-in didn't complete",
    sub: "We couldn't finish your sign-in. Try again, or use a magic link.",
  },
};

/**
 * Error state shown when a magic link is expired/invalid or OAuth fails.
 * Rendered at /auth/error?reason=... . Falls back to "unknown" for bad input.
 */
export function AuthErrorPage({ productName, reason }: { productName: string; reason?: string }) {
  const key = (["expired", "invalid", "oauth", "unknown"].includes(reason ?? "")
    ? reason
    : "unknown") as ErrorReason;
  const copy = ERROR_COPY[key];
  return (
    <div className="ms-marketing ms-app ms-noise ms-auth-page">
      <div className="ms-auth-card">
        <div className="ms-auth-brand">{productName}</div>
        <h1 className="ms-auth-title">{copy.title}</h1>
        <p className="ms-auth-sub">{copy.sub}</p>
        <div className="ms-auth-actions">
          <a className="ms-auth-cta" href="/login">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}

/** Re-export for apps that want the standard login alongside the status pages. */
export { LoginPage };
