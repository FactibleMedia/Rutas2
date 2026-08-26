// Ad-hoc visual-regression helper for the design-system refactor. Not part of
// the app or CI -- run manually before/after each phase to prove no rendered
// pixel moved. Requires `npm run preview` running on port 4173 and
// `npx playwright install chromium` done once.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const routes = [
  "/inicio",
  "/mapas",
  "/glosario",
  "/galeria",
  "/acerca-de",
  "/rutas-interactivas",
  "/terminos-y-condiciones",
  "/terminos-de-uso-y-cookies",
  "/mis-aportes",
  "/admin",
];

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 },
];

const base = process.env.SNAPSHOT_BASE || "http://localhost:4173";
const outDir = process.argv[2];
if (!outDir) {
  console.error("Usage: node scripts/visual-snapshot.mjs <out-dir>");
  process.exit(1);
}

const browser = await chromium.launch();
for (const vp of viewports) {
  const dir = `${outDir}/${vp.name}`;
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  for (const route of routes) {
    const name = route.replace(/\//g, "_") || "_root";
    try {
      await page.goto(`${base}${route}`, { waitUntil: "load", timeout: 20000 });
      await page.waitForTimeout(1800); // settle animations/fonts/data fetches
      await page.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
      console.log(`  ok    ${vp.name} ${route}`);
    } catch (err) {
      console.log(`  FAIL  ${vp.name} ${route} -- ${err.message.split("\n")[0]}`);
    }
  }
  await page.close();
}
await browser.close();
console.log(`Done. Screenshots in ${outDir}`);
