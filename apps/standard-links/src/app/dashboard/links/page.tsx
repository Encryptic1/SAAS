import { LinksManager } from "@/components/links-manager";
import { listOwnerLinks } from "@/lib/links-data";
import { resolvePortfolioUrl } from "@market-standard/ui";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const links = await listOwnerLinks();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? resolvePortfolioUrl("links");
  return <LinksManager initial={links} appUrl={appUrl} />;
}
