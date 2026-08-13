// Until vijayabhaskar.in's DNS is pointed at GitHub Pages (see README §
// "One-time setup"), the only reachable copy of this build is the project
// page at https://<user>.github.io/vijaysite/, which requires every asset
// URL to carry the /vijaysite prefix. The deploy workflow sets
// NEXT_PUBLIC_BASE_PATH for that build; local dev leaves it unset.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
