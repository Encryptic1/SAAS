import type { MetadataRoute } from "next";
import { buildRobots } from "@market-standard/ui/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  return buildRobots({ product: "status" });
}
