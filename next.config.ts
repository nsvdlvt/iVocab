import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.2.1",
    "192.168.1.1",
    "192.168.0.1",
    "localhost",
  ],
  experimental: {
    instantNavigationDevToolsToggle: true,
  },
  async redirects() {
    return [
      {
        source: "/e-team",
        destination: "/e-team/dashboard",
        permanent: false,
      },
      {
        source: "/dashboard",
        destination: "/u",
        permanent: false,
      },
      {
        source: "/vocabulary",
        destination: "/u/vocabulary",
        permanent: false,
      },
      {
        source: "/learn",
        destination: "/u/vocabulary",
        permanent: false,
      },
      {
        source: "/u/learn",
        destination: "/u/vocabulary",
        permanent: false,
      },
      {
        source: "/hoc-tu-vung",
        destination: "/u/vocabulary",
        permanent: false,
      },
      {
        source: "/vocabulary/:path*",
        destination: "/u/vocabulary/:path*",
        permanent: false,
      },
      {
        source: "/vocabulary-management",
        destination: "/u/vocabulary-management",
        permanent: false,
      },
      {
        source: "/vocabulary-management/:path*",
        destination: "/u/vocabulary-management/:path*",
        permanent: false,
      },
      {
        source: "/dictionary",
        destination: "/u/dictionary",
        permanent: false,
      },
      {
        source: "/dictionary/:path*",
        destination: "/u/dictionary/:path*",
        permanent: false,
      },
      {
        source: "/reading",
        destination: "/u/reading",
        permanent: false,
      },
      {
        source: "/reading/:path*",
        destination: "/u/reading/:path*",
        permanent: false,
      },
      {
        source: "/quiz",
        destination: "/u/quiz",
        permanent: false,
      },
      {
        source: "/quiz/:path*",
        destination: "/u/quiz/:path*",
        permanent: false,
      },
      {
        source: "/review",
        destination: "/u/review",
        permanent: false,
      },
      {
        source: "/review/:path*",
        destination: "/u/review/:path*",
        permanent: false,
      },
      {
        source: "/statistics",
        destination: "/u/statistics",
        permanent: false,
      },
      {
        source: "/statistics/:path*",
        destination: "/u/statistics/:path*",
        permanent: false,
      },
      {
        source: "/settings",
        destination: "/u/settings",
        permanent: false,
      },
      {
        source: "/settings/:path*",
        destination: "/u/settings/:path*",
        permanent: false,
      },
      {
        source: "/ai",
        destination: "/u/ai",
        permanent: false,
      },
      {
        source: "/ai/:path*",
        destination: "/u/ai/:path*",
        permanent: false,
      },
      {
        source: "/notifications",
        destination: "/u/notifications",
        permanent: false,
      },
      {
        source: "/notifications/:path*",
        destination: "/u/notifications/:path*",
        permanent: false,
      },
      {
        source: "/test-ai",
        destination: "/u/test-ai",
        permanent: false,
      },
      {
        source: "/test-ai/:path*",
        destination: "/u/test-ai/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
