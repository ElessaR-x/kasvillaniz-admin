import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['s3.eu-north-1.amazonaws.com']
  },
  // TinyMCE dil dosyaları için static dosya servisini etkinleştir
  async rewrites() {
    return [
      {
        source: '/tinymce/langs/:path*',
        destination: '/tinymce/langs/:path*',
      },
    ];
  }
};

export default nextConfig;
