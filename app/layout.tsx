import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./n8n-styles.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Marc Bau Portfolio",
  description: "AI Voice Assistant for your business",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@vapi-ai/web@latest/dist/vapi.js"
          strategy="beforeInteractive"
          type="module"
          crossOrigin="anonymous"
        />
        <Script src="https://cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs@2.0.0/webcomponents-loader.js" strategy="afterInteractive" />
        <Script src="https://www.unpkg.com/lit@2.0.0-rc.2/polyfill-support.js" strategy="afterInteractive" />
        <Script type="module" src="https://cdn.jsdelivr.net/npm/@n8n_io/n8n-demo-component/n8n-demo.bundled.js" strategy="afterInteractive" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
