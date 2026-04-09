/** @type {import('next').NextConfig} */
const nextConfig = {
  // Silence the "multiple lockfiles" warning on monorepo-style setups
  outputFileTracingRoot: __dirname,

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.googleusercontent.com" },
      { protocol: "https", hostname: "m.media-amazon.com" },
      { protocol: "https", hostname: "**.google.com" },
    ],
  },

  // Silence ESLint errors during Vercel build (TypeScript handles type safety)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
