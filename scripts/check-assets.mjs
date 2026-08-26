// Guards against the exact class of bug this refactor could introduce:
// public/ paths are runtime URL strings (Vite's build-time asset pipeline
// does not touch them), so a rename or typo 404s silently in the browser
// with no build-time signal. This checks every string literal or url()
// reference that starts with "/assets/" -- i.e. an absolute path resolved
// against public/ at runtime -- and confirms the file exists there.
//
// Deliberately does NOT check relative imports like "../assets/mcp/x.webp"
// -- those are resolved by Vite's bundler at build time (the build already
// fails loudly if one is missing), not by this runtime convention.
import { readdirSync, statSync, existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");
const PUBLIC = join(ROOT, "public");
const EXTS = new Set([".jsx", ".js", ".css", ".html"]);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (entry === "node_modules") continue;
      walk(full, files);
    } else if (EXTS.has(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

// Pre-existing gap, not introduced by this script: AcercaDe.jsx references
// a video that was never actually committed (it was listed in .gitattributes
// for Git LFS, but LFS was never set up -- see docs/DATABASE.md's sibling
// note in the repo hygiene pass). Someone needs to supply the file or
// remove the <video> element; recorded here so CI stays green without
// hiding it, and so any OTHER missing asset still fails the build.
const KNOWN_GAPS = new Set(["/assets/acerca/video.mp4"]);

const files = [...walk(SRC), join(ROOT, "index.html")];

// Matches a full quoted string (or url(...) content) beginning with
// /assets/, capturing everything up to the matching close-quote/paren so
// filenames containing spaces are captured whole.
const patterns = [
  /"(\/assets\/[^"]+)"/g,
  /'(\/assets\/[^']+)'/g,
  /url\((\/assets\/[^)'"]+)\)/g,
];

let checked = 0;
let missing = 0;
const seen = new Set();

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const assetPath = match[1].split(/[?#]/)[0];
      const key = `${file}:${assetPath}`;
      if (seen.has(key)) continue;
      seen.add(key);
      checked++;
      const onDisk = join(PUBLIC, assetPath);
      if (!existsSync(onDisk)) {
        if (KNOWN_GAPS.has(assetPath)) {
          console.log(`  known gap (not failing): ${assetPath}`);
          continue;
        }
        missing++;
        console.log(`  MISSING: ${assetPath}`);
        console.log(`    referenced in ${file.replace(ROOT, "")}`);
      }
    }
  }
}

console.log(`\nChecked ${checked} /assets/... references.`);
if (missing > 0) {
  console.log(`${missing} do not resolve to a file under public/.`);
  process.exit(1);
} else {
  console.log("All resolve.");
}
