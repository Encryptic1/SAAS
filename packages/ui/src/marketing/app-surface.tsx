import type { ReactNode } from "react";

/** Dark app chrome for dashboards and tool pages — matches marketing theme. */
export function AppSurface({ children }: { children: ReactNode }) {
  return (
    <div className="ms-marketing ms-app ms-noise min-h-screen min-h-[100dvh]">{children}</div>
  );
}
