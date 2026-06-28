import { LinksManager } from "@/components/links-manager";
import { listOwnerLinks } from "@/lib/links-data";

export const dynamic = "force-dynamic";

export default async function LinksPage() {
  const links = await listOwnerLinks();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3007";
  return <LinksManager initial={links} appUrl={appUrl} />;
}
