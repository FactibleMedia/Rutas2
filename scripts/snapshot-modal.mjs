// One-off: opens the "sugerir palabra" modal on /glosario (unauthenticated
// -> shows the login-prompt state, which contains .submit-word__btn-login)
// and screenshots it, to visually verify the CTA button unification on a
// component not reachable via a plain page load.
import { chromium } from "playwright";
const base = process.env.SNAPSHOT_BASE || "http://localhost:4173";
const outDir = process.argv[2] || "/tmp/rutas-snapshots/modal";
import { mkdirSync } from "node:fs";
mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${base}/glosario`, { waitUntil: "load" });
await page.waitForTimeout(1500);

const btn = page.getByText("ESCRIBE TU PALABRA", { exact: false });
if (await btn.count() > 0) {
  await btn.first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${outDir}/submit-word-modal.png`, fullPage: true });
  console.log("captured submit-word modal");
} else {
  console.log("button not found");
}
await browser.close();
