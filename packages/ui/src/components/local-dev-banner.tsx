import { getPortfolioUrls } from "../marketing/portfolio-urls";

export function LocalDevBanner() {
  if (process.env.NEXT_PUBLIC_LOCAL_DEV !== "true") {
    return null;
  }

  const urls = getPortfolioUrls();

  return (
    <div className="ms-local-banner">
      <span className="font-medium text-[var(--text-foam)]">Local dev</span> — PGlite database with seeded demo
      data.{" "}
      <a href={urls.polls}>Polls</a>
      {" · "}
      <a href={urls.proof}>Proof</a>
      {" · "}
      <a href={urls.metrics}>Metrics</a>
    </div>
  );
}
