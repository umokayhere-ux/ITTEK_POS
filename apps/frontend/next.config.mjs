/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Static export: `next build` emits a fully static site to `out/`, which the
  // backend serves alongside the API so the whole app deploys as ONE service.
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com' }],
  },
};

export default nextConfig;
