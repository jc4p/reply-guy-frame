import { Karla } from "next/font/google";
import Script from "next/script";
import { FrameInit } from "@/components/FrameInit";
import "./globals.css";

const karla = Karla({ subsets: ["latin"] });

export async function generateMetadata({ searchParams }) {
  const fid = searchParams?.fid;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  
  const imageUrl = fid 
    ? `${baseUrl}/api/og?fid=${fid}`
    : "https://cover-art.kasra.codes/reply-guy-icon-512-square.png";

  return {
    title: "Are You A Reply Guy?",
    description: "Analyze your Farcaster casts and discover your posting personality",
    icons: {
      icon: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
      shortcut: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
      apple: "https://cover-art.kasra.codes/reply-guy-icon-512.png",
    },
    other: {
      'fc:frame': JSON.stringify({
        version: "next",
        imageUrl,
        button: {
          title: "Analyze My Casts",
          action: {
            type: "launch_frame",
            name: "Reply Guy Analyzer",
            url: baseUrl,
            splashImageUrl: imageUrl,
            splashBackgroundColor: "#274374"
          }
        }
      })
    }
  };
}

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
