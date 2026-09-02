/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const isStaticExport = process.env.STATIC_EXPORT === "true" || Boolean(basePath);

const nextConfig = {
  reactStrictMode: true,
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      }
    : {}),
};

export default nextConfig;
