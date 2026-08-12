import sharp from "sharp";
import { writeFileSync } from "node:fs";

const svg = `
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#FBF3E7"/>
  <text x="80" y="320" font-family="Georgia, serif" font-size="64" font-weight="700" fill="#2B211A">Vijaya Bhaskar Jatoth</text>
  <text x="80" y="380" font-family="Georgia, serif" font-size="32" fill="#C1512D">Entrepreneur &amp; Author</text>
</svg>
`;

const png = await sharp(Buffer.from(svg)).png().toBuffer();
writeFileSync("public/og-image.png", png);
console.log("Wrote public/og-image.png:", png.length, "bytes");
