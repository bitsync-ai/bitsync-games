import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isGitHubPages ? "/bitsync-games/games/pixel-slugger" : "",
  assetPrefix: isGitHubPages ? "/bitsync-games/games/pixel-slugger/" : "",
};

export default nextConfig;
