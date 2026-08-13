import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const outDir = "out";

/** Recursively find every file under `dir` whose name matches `suffix`. */
function findFiles(dir, suffix) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true })
    .filter((entry) => entry.endsWith(suffix))
    .map((entry) => join(dir, entry));
}

const requiredFiles = [
  "index.html",
  "about/index.html",
  "experience/index.html",
  "contact/index.html",
  "sitemap.xml",
  "robots.txt",
  "CNAME",
];

const forbiddenStrings = [
  "XXXXX",
  'href="#"',
  "Google+",
  "Punctual",
  "Often people default",
  "Born in India - Proud Indian",
];

const requiredStrings = [
  "stuMagz",
  "Tsearch.in",
  "ATAL Innovation Mission",
  "SharePoint",
  "Manipal Academy of Higher Education",
  "Mahatma Gandhi Institute of Technology",
  "Student Tribe",
];

// Social platforms that must never appear anywhere in the shipped output.
// Only Instagram, Facebook (vijayabhaskarofficial), and Behance
// (jatothvijayabhaskar — his real, verified portfolio profile) are approved.
const forbiddenSocialFragments = [
  "twitter.com",
  "x.com",
  "linkedin.com",
  "youtube.com",
  "plus.google.com",
];

// Design-token colors that must actually reach the compiled CSS (not just
// tailwind.config.ts). Tailwind v3 emits color utilities as decimal
// `rgb(r g b / <alpha>)`/`rgba(r,g,b,a)`, not literal hex, so we check for
// the decimal triple rather than grepping for the hex string itself.
const paletteColors = {
  ink: "#0b0b0c",
  paper: "#f2f1ed",
  amber: "#ffb020",
  signal: "#5b8cff",
};

function hexToRgbTriple(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(join(outDir, file))) {
    console.error(`MISSING: ${file}`);
    failed = true;
  }
}

// Discover every shipped HTML file (not just the hardcoded route list above)
// so future pages, and the 404 page, are automatically covered by the
// forbidden-string/required-fact/social checks below.
const htmlFiles = findFiles(outDir, ".html");

if (htmlFiles.length === 0) {
  console.error("No HTML files found under out/ — did the build run?");
  failed = true;
}

const html = htmlFiles.map((f) => readFileSync(f, "utf8")).join("\n");

for (const bad of forbiddenStrings) {
  if (html.includes(bad)) {
    console.error(`FORBIDDEN STRING FOUND: "${bad}"`);
    failed = true;
  }
}

for (const good of requiredStrings) {
  if (!html.includes(good)) {
    console.error(`MISSING REQUIRED FACT: "${good}"`);
    failed = true;
  }
}

for (const fragment of forbiddenSocialFragments) {
  if (html.toLowerCase().includes(fragment)) {
    console.error(`FORBIDDEN SOCIAL PLATFORM REFERENCE FOUND: "${fragment}"`);
    failed = true;
  }
}

for (const file of htmlFiles) {
  const fileHtml = readFileSync(file, "utf8");
  if (!fileHtml.includes('property="og:image"')) {
    console.error(`MISSING og:image meta tag: ${file}`);
    failed = true;
  }
}

const cssFiles = findFiles(join(outDir, "_next", "static", "css"), ".css");
if (cssFiles.length === 0) {
  console.error("No compiled CSS files found under out/_next/static/css — did the build run?");
  failed = true;
} else {
  const css = cssFiles.map((f) => readFileSync(f, "utf8")).join("\n");
  for (const [name, hex] of Object.entries(paletteColors)) {
    const [r, g, b] = hexToRgbTriple(hex);
    const pattern = new RegExp(`${r}[,\\s]+${g}[,\\s]+${b}`);
    if (!pattern.test(css)) {
      console.error(
        `DESIGN TOKEN MISSING FROM COMPILED CSS: ${name} (${hex}) never reaches the shipped stylesheet`
      );
      failed = true;
    }
  }
}

if (failed) {
  console.error("\nExport verification FAILED.");
  process.exit(1);
} else {
  console.log("Export verification passed: no placeholders, all required facts present.");
  process.exit(0);
}
