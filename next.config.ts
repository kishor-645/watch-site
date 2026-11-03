import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Pin images to this project's own Blob store when the token is available at build time
 * (`vercel_blob_rw_<storeId>_<secret>` → `<storeid>.public.blob.vercel-storage.com`, same parsing
 * as src/server/blob.ts). Without it (e.g. local builds) any Blob store host is allowed.
 */
const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.split("_")[3];
const blobImageHost =
  blobStoreId && /^[a-z0-9]+$/i.test(blobStoreId)
    ? `${blobStoreId.toLowerCase()}.public.blob.vercel-storage.com`
    : "*.public.blob.vercel-storage.com";

// Inline scripts/styles are required by Next.js App Router hydration without a nonce setup.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://images.unsplash.com https://${blobImageHost}`,
  "font-src 'self' data:",
  // Vercel Blob client uploads PUT directly to blob storage.
  "connect-src 'self' https://vercel.com/api/blob/ https://*.vercel-storage.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: blobImageHost },
    ],
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/api/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
