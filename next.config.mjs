/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/upload': ['./node_modules/pdf-parse/dist/pdf-parse/esm/pdf.worker.mjs']
    }
  }
};

export default nextConfig;
