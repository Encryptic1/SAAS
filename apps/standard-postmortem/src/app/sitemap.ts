import type { MetadataRoute } from "next";
import { buildSitemap } from "@market-standard/ui/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return buildSitemap({ product: "postmortem" });
}
