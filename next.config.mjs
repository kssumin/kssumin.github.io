/** @type {import('next').NextConfig} */
const isProd = process.env.NEXT_PUBLIC_ENVIRONMENT === 'PRODUCTION';

const nextConfig = {
  trailingSlash: true,
  ...(isProd
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
