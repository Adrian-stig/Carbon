import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://carbon-six-gamma.vercel.app"),
  title: "碳迹 · 上海",
  description: "每周记录衣食住行，让个人减碳变得清晰而具体。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "碳迹 · 上海",
    description: "每周记录，让减碳清晰可见。",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/og-carbon-tracker.png",
        width: 1731,
        height: 909,
        alt: "碳迹个人碳足迹跟踪网站",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "碳迹 · 上海",
    description: "每周记录，让减碳清晰可见。",
    images: ["/og-carbon-tracker.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
