/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  // Workaround: Next 13.5.1 SWC minifier gagal parse backtick di dalam
  // string error message @radix-ui/react-progress >=1.1.0
  swcMinify: false,
};

module.exports = nextConfig;
