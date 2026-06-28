import { notFound } from "next/navigation";
import { AppSurface } from "@market-standard/ui";
import { SubmitTestimonialForm } from "@/components/submit-testimonial-form";
import { getCollectionBySlug } from "@/lib/proof-data";

export const dynamic = "force-dynamic";

interface SubmitPageProps {
  params: Promise<{ slug: string }>;
}

export default async function SubmitPage({ params }: SubmitPageProps) {
  const { slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  return (
    <AppSurface>
      <main className="ms-app-main max-w-lg">
        <h1 className="ms-app-title">Submit a testimonial</h1>
        <p className="mt-2 ms-app-muted">{collection.name}</p>
        <div className="mt-8 ms-app-card p-6">
          <SubmitTestimonialForm slug={collection.slug} collectionName={collection.name} />
        </div>
      </main>
    </AppSurface>
  );
}
