import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { siteConfig } from "@/constants/site";
import { Providers } from "@/providers/Providers";
import "./globals.css";
import { perfEnd, perfStart } from "@/lib/perf";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const timer = perfStart("route:root-layout");
  try {
    return (
      <html
        lang="vi"
        className={`${beVietnamPro.variable} h-full antialiased`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <Providers>{children}</Providers>
        </body>
      </html>
    );
  } finally {
    perfEnd(timer);
  }
}
