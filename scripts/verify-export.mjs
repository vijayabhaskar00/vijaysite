import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const outDir = "out";

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

const requiredStrings = ["stuMagz", "Tsearch.in", "ATAL Innovation Mission", "SharePoint"];

let failed = false;

for (const file of requiredFiles) {
  if (!existsSync(join(outDir, file))) {
    console.error(`MISSING: ${file}`);
    failed = true;
  }
}

const htmlFiles = requiredFiles.filter((f) => f.endsWith(".html"));
const html = htmlFiles
  .filter((f) => existsSync(join(outDir, f)))
  .map((f) => readFileSync(join(outDir, f), "utf8"))
  .join("\n");

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

for (const file of htmlFiles) {
  const filePath = join(outDir, file);
  if (!existsSync(filePath)) continue; // already reported as MISSING above
  const fileHtml = readFileSync(filePath, "utf8");
  if (!fileHtml.includes('property="og:image"')) {
    console.error(`MISSING og:image meta tag: ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error("\nExport verification FAILED.");
  process.exit(1);
} else {
  console.log("Export verification passed: no placeholders, all required facts present.");
  process.exit(0);
}
