// One-off: confirms the browser actually loaded and is using the WOFF2
// fonts (not silently falling back to a system font because the woff2
// file failed to parse), by checking document.fonts after the page settles.
import { chromium } from "playwright";
const base = process.env.SNAPSHOT_BASE || "http://localhost:4173";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/inicio`, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const loaded = await page.evaluate(() => {
  const out = [];
  document.fonts.forEach((f) => {
    if (f.family.includes("Trattatello") || f.family.includes("Heritage")) {
      out.push(`${f.family} ${f.weight} ${f.style} -- status: ${f.status}`);
    }
  });
  return out;
});

console.log("Loaded local @font-face entries:");
loaded.forEach((l) => console.log(`  ${l}`));

const allLoaded = loaded.length > 0 && loaded.every((l) => l.includes("status: loaded"));
console.log(allLoaded ? "\nBoth local fonts report status: loaded." : "\nFAIL -- a font did not load.");
await browser.close();
process.exit(allLoaded ? 0 : 1);
