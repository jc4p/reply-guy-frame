import { Karla } from "next/font/google";
import Script from "next/script";
import { FrameInit } from "@/components/FrameInit";
import "./globals.css";

const karla = Karla({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://cdn.jsdelivr.net/npm/@farcaster/frame-sdk/dist/index.min.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className={karla.className}>
        <div className="min-h-screen bg-dark-quartz">
          {children}
          <FrameInit />
        </div>
      </body>
    </html>
  );
}
