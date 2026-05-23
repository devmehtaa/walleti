/** @type {import('next').NextConfig} */
module.exports = {
  transpilePackages: ["@repo/ui", "@repo/redis", "@repo/metrics", "@repo/wallet-core"],
};
