import Link from "next/link";
import { EmptyState } from "@market-standard/ui";

export default function DigestPage() {
  return (
    <div className="ms-dash-page">
      <h1 className="ms-dash-title">Suite Digest</h1>
      <p className="ms-dash-subtitle">
        Daily or weekly Slack summary of MRR, FloodG8 runs, SyncDevTime hours, and closed polls.
      </p>
      <EmptyState
        title="Configure your digest"
        description="Connect Slack in Settings, then choose daily or weekly delivery. Starter plans unlock daily digests and custom channels."
        action={
          <Link href="/dashboard/settings" className="ms-btn ms-btn-gilt">
            Go to Settings
          </Link>
        }
      />
    </div>
  );
}
