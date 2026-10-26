import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://rmu.universalmind.tv"),
  title: "Re-Model Intelligence | Culture Intelligence Dashboard",
  description: "A social intelligence dashboard for cultural positioning, measurable impact and shared-values strategy.",
  icons: { icon: "/re-model-favicon.png" },
  openGraph: {
    title: "Re-Model Intelligence",
    description: "Culture, modelled. Impact, measured.",
    images: [{ url: "/re-model-intelligence-social.png", width: 1731, height: 909 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Re-Model Intelligence",
    description: "Culture, modelled. Impact, measured.",
    images: ["/re-model-intelligence-social.png"],
  },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body>
    </html>
  );
}
