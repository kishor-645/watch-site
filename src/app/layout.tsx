import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { getSiteUrl } from "@/lib/site-url";
import { getSiteSettings } from "@/server/queries/settings";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { general, seo } = await getSiteSettings();
  const title = seo.title || general.siteName;
  const description = seo.description || general.tagline;
  return {
    metadataBase: new URL(getSiteUrl()),
    title: { default: title, template: `%s | ${general.siteName}` },
    description,
    applicationName: general.siteName,
    openGraph: {
      type: "website",
      siteName: general.siteName,
      title,
      description,
      ...(seo.ogImageUrl && { images: [{ url: seo.ogImageUrl }] }),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d0c0b",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} min-h-screen antialiased`}>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
