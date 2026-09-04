// One-off verification for the design-token refactor: confirms every
// rewired CSS custom property resolves to the exact same computed color/
// font it had before, by applying each var() to a probe element and
// reading the browser's resolved value. Not part of the app or CI.
import { chromium } from "playwright";

const expected = {
  "--cream": "rgb(255, 252, 230)",       // #fffce6
  "--dark": "rgb(26, 15, 8)",            // #1a0f08
  "--orange": "rgb(187, 76, 24)",        // #bb4c18
  "--amber": "rgb(232, 152, 27)",        // #e8981b
  "--green": "rgb(98, 124, 80)",         // #627c50
  "--purple": "rgb(86, 78, 135)",        // #564e87
  "--forest": "rgb(70, 76, 51)",         // #464c33
  "--gold": "rgb(212, 168, 83)",         // #d4a853
};

const expectedGlos = {
  "--glos-primary": "rgb(187, 76, 24)",  // #bb4c18
  "--glos-cream": "rgb(255, 252, 230)",  // #fffce6
  "--glos-gold": "rgb(232, 152, 27)",    // #e8981b
  "--glos-green": "rgb(70, 76, 51)",     // #464c33
  "--glos-purple": "rgb(86, 78, 135)",   // #564e87
  "--glos-bg-cats": "rgb(255, 252, 230)",// #fffce6
};

const expectedGlosFonts = {
  "--font-trattatello": '"Trattatello", fantasy',
  "--font-heritage": '"Heritage Sans", Georgia, serif',
  "--font-roboto": '"Roboto", Arial, sans-serif',
  "--font-outfit": '"Outfit", Arial, sans-serif',
};

const expectedGalleryFonts = {
  "--font-heritage": '"Heritage Sans", Georgia, serif',
  "--font-trattatello": '"Trattatello", fantasy',
  "--font-inter": '"Inter", sans-serif',
};

const base = process.env.SNAPSHOT_BASE || "http://localhost:4173";

const browser = await chromium.launch();
const page = await browser.newPage();

async function checkColorsOn(route, tokenSet) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(1500); // let the lazy chunk's <link rel=stylesheet> apply
  return page.evaluate((tokens) => {
    const probe = document.createElement("div");
    document.body.appendChild(probe);
    const out = {};
    for (const name of tokens) {
      probe.style.background = `var(${name})`;
      out[name] = getComputedStyle(probe).backgroundColor;
    }
    probe.remove();
    return out;
  }, Object.keys(tokenSet));
}

async function checkFontsOn(route, tokenSet) {
  await page.goto(`${base}${route}`, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  return page.evaluate((tokens) => {
    const root = document.documentElement;
    const out = {};
    for (const name of tokens) {
      out[name] = getComputedStyle(root).getPropertyValue(name).trim();
    }
    return out;
  }, Object.keys(tokenSet));
}

let failures = 0;

console.log("-- shared brand colors on /inicio --");
const colors = await checkColorsOn("/inicio", expected);
for (const [name, want] of Object.entries(expected)) {
  const got = colors[name];
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}: got "${got}" want "${want}"`);
}

console.log("-- --glos-* colors on /glosario --");
const glosColors = await checkColorsOn("/glosario", expectedGlos);
for (const [name, want] of Object.entries(expectedGlos)) {
  const got = glosColors[name];
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}: got "${got}" want "${want}"`);
}

console.log("-- fonts on /glosario --");
const fonts = await checkFontsOn("/glosario", expectedGlosFonts);
for (const [name, want] of Object.entries(expectedGlosFonts)) {
  const got = fonts[name];
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}: got "${got}" want "${want}"`);
}

console.log("-- fonts on /galeria --");
const galleryFonts = await checkFontsOn("/galeria", expectedGalleryFonts);
for (const [name, want] of Object.entries(expectedGalleryFonts)) {
  const got = galleryFonts[name];
  const ok = got === want;
  if (!ok) failures++;
  console.log(`  ${ok ? "ok  " : "FAIL"} ${name}: got "${got}" want "${want}"`);
}

console.log("-- --font-heritage on /terminos-y-condiciones (no Glossary.css loaded -- deliberately different, no Georgia fallback) --");
const termsFonts = await checkFontsOn("/terminos-y-condiciones", { "--font-heritage": "" });
const wantTermsHeritage = '"Heritage Sans", serif';
const gotTermsHeritage = termsFonts["--font-heritage"];
const okTerms = gotTermsHeritage === wantTermsHeritage;
if (!okTerms) failures++;
console.log(`  ${okTerms ? "ok  " : "FAIL"} --font-heritage: got "${gotTermsHeritage}" want "${wantTermsHeritage}"`);

await browser.close();

if (failures > 0) {
  console.log(`\n${failures} MISMATCH(ES)`);
  process.exit(1);
} else {
  console.log("\nAll tokens resolve to their original values.");
}
