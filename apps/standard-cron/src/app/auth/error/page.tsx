import { AuthErrorPage } from "@market-standard/ui";

type Props = { searchParams: Promise<{ reason?: string }> };

export default async function ErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return <AuthErrorPage productName="Standard Cron" reason={reason} />;
}
