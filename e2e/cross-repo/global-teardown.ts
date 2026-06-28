/**
 * Phase 12: cross-repo global teardown. No-op — the dev stack is managed by
 * `pnpm dev:local` (or the regular e2e global-setup) and should stay up for
 * the next test run. We only log a completion marker.
 */
export default async function globalTeardown(): Promise<void> {
  console.log("[cross-repo] Suite complete. Dev stack left running for subsequent runs.");
}
