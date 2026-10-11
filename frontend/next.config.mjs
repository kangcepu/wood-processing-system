/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@wps/ui", "@wps/contracts"],
  output: "standalone",
};

export default nextConfig;
