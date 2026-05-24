import { chromium } from "playwright";
import { join } from "node:path";
import { homedir } from "node:os";

const USER_DATA_DIR = join(homedir(), ".playwright-gsc-indexation");
const PROPERTY = "sc-domain:enomia.app";
const TARGET_URL = "https://www.enomia.app/conciergerie-airbnb/ile-de-france/paris";
const DASHBOARD = `https://search.google.com/search-console?resource_id=${encodeURIComponent(PROPERTY)}`;
const INSPECT = `https://search.google.com/search-console/inspect?resource_id=${encodeURIComponent(PROPERTY)}&id=${encodeURIComponent(TARGET_URL)}`;

const ctx = await chromium.launchPersistentContext(USER_DATA_DIR, { headless: true, channel: "chrome", locale: "fr-FR" });
const page = await ctx.newPage();

console.log("→ Dashboard");
await page.goto(DASHBOARD, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(5000);
console.log("   URL:", page.url());
console.log("   title:", await page.title());

console.log("\n→ Inspect");
await page.goto(INSPECT, { waitUntil: "domcontentloaded", timeout: 30000 });
await page.waitForTimeout(8000);
console.log("   URL:", page.url());
console.log("   title:", await page.title());

await page.screenshot({ path: "/tmp/gsc-after-inspect.png" });
console.log("\n→ Screenshot /tmp/gsc-after-inspect.png");

await ctx.close();
