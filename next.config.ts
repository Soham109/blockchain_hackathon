import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Increase body size limit to 10MB for image uploads
    },
  },
};

export default nextConfig;
