import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const site = read("../src/lib/site-url.ts");
const layout = read("../src/app/layout.tsx");
const pages = {
    "/": read("../src/app/page.tsx"),
    "/services": read("../src/app/services/page.tsx"),
    "/book": read("../src/app/book/page.tsx"),
};
const sitemap = read("../src/app/sitemap.ts");
const robots = read("../src/app/robots.ts");

assert.match(site, /SITE_ORIGIN = "https:\/\/serpentenailroom\.site"/);
assert.match(layout, /metadataBase:\s*new URL\(SITE_ORIGIN\)/);
for (const [path, source] of Object.entries(pages)) {
    assert.ok(source.includes(`canonical: "${path}"`), `Missing canonical for ${path}`);
}
assert.match(sitemap, /SITE_ORIGIN/);
assert.match(robots, /SITE_ORIGIN/);
assert.match(robots, /\/sitemap\.xml/);

const nextConfig = read("../next.config.ts");
assert.match(nextConfig, /type: "host" as const, value: "nail-salon-web-v2\\.vercel\\.app"/);
assert.match(nextConfig, /destination: \`\\$\\{SITE_ORIGIN\\}\\/:path\\*\`/);
assert.match(nextConfig, /permanent: true/);

const legacyDomain = ["nail-salon-web-v2", "vercel", "app"].join(".");
for (const file of [
    "../../README.md",
    "../../docs/DEPLOYMENT.md",
    "../../docs/DEMO.md",
    "../../docs/PORTFOLIO.md",
    "../src/app/layout.tsx",
    "../src/app/page.tsx",
    "../src/app/services/page.tsx",
    "../src/app/book/page.tsx",
]) {
    assert.ok(!read(file).includes(legacyDomain), `Legacy URL found in ${file}`);
}
console.log("PASS: production canonical domain, metadata, sitemap, robots and public links");
