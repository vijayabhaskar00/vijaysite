// One-off manual script. `public/og-image.png` is already committed and does
// NOT need to be regenerated as part of a normal build — `sharp` is
// therefore not a standing devDependency (it costs every CI install for a
// script that runs once). To regenerate this image, first run:
//   npm install --save-dev sharp
// and then run this script with type-stripping enabled (Node 22.6+), since
// it imports content/site.ts directly:
//   node --experimental-strip-types scripts/generate-og-image.mjs
import sharp from "sharp";
import { writeFileSync } from "node:fs";
import { site } from "../content/site.ts";

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FBF3E7"/>
  <text x="80" y="320" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#2B211A">${site.name}</text>
  <text x="80" y="380" font-family="Georgia, serif" font-size="32" fill="#C1512D">${site.tagline}</text>
</svg>
`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync("public/og-image.png", png);
console.log("Wrote public/og-image.png:", png.length, "bytes");
