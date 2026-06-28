"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@market-standard/auth/browser";

interface LoginPageProps {
  productName: string;
  redirectTo?: string;
}

export function LoginPage({ productName, redirectTo = "/dashboard" }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    if (error) setMessage(error.message);
    setLoading(false);
  }

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
    setMessage(error ? error.message : "Check your email for the login link.");
    setLoading(false);
  }

  return (
    <div className="ms-app ms-noise flex min-h-screen items-center justify-center px-4">
      <div className="ms-app-card w-full max-w-md p-8">
        <h1 className="ms-app-title text-center">Sign in to {productName}</h1>
        <p className="mt-2 text-center text-sm ms-app-muted">
          Use the same account as FloodG8 and SyncDevTime.
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={loading}
          className="ms-btn ms-btn-primary mt-8 w-full"
        >
          Continue with Google
        </button>
        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs ms-app-muted">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <form onSubmit={signInWithMagicLink} className="space-y-4">
          <div>
            <label htmlFor="email" className="ms-app-label">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ms-app-input"
              required
            />
          </div>
          <button type="submit" disabled={loading} className="ms-btn ms-btn-gilt w-full">
            Send magic link
          </button>
        </form>
        {message && <p className="mt-4 text-center text-sm text-[var(--color-flood)]">{message}</p>}
      </div>
    </div>
  );
}
