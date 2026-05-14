import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Build "standalone" para que la imagen Docker de prod sea liviana:
  // copia solo lo necesario en lugar de todo node_modules.
  // https://nextjs.org/docs/app/api-reference/config/next-config-js/output
  output: "standalone",
};

export default nextConfig;
