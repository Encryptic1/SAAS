import { expect, test } from "@playwright/test";
import { BASE } from "./helpers";

const APPS: Array<{ name: string; base: string }> = [
  { name: "Polls", base: BASE.polls },
  { name: "Proof", base: BASE.proof },
  { name: "Metrics", base: BASE.metrics },
  { name: "Hook", base: BASE.hook },
  { name: "Release", base: BASE.release },
  { name: "Vault", base: BASE.vault },
  { name: "Links", base: BASE.links },
  { name: "Snippets", base: BASE.snippets },
  { name: "Status", base: BASE.status },
  { name: "Regex", base: BASE.regex },
  { name: "Postmortem", base: BASE.postmortem },
  { name: "Lens", base: BASE.lens },
  { name: "Cron", base: BASE.cron },
];

test.describe("SEO — sitemap + robots", () => {
  for (const app of APPS) {
    test(`${app.name} serves a valid sitemap.xml`, async ({ request }) => {
      const res = await request.get(`${app.base}/sitemap.xml`);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body).toContain("<urlset");
      expect(body).toContain(`<loc>${app.base}/</loc>`);
      expect(body).toContain(`<loc>${app.base}/privacy</loc>`);
    });

    test(`${app.name} serves a robots.txt that disallows dashboard + api`, async ({ request }) => {
      const res = await request.get(`${app.base}/robots.txt`);
      expect(res.status()).toBe(200);
      const body = await res.text();
      expect(body).toContain("User-Agent:");
      expect(body).toContain("Disallow: /dashboard");
      expect(body).toContain("Disallow: /api");
      expect(body).toMatch(/Sitemap: .+\/sitemap\.xml/);
    });
  }
});
