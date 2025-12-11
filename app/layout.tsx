import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter_Tight, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})


export const metadata: Metadata = {
  title: "Chesso | Chess Coaching for Beginners & Pros with AI",
  description: "Whether you're starting out or aiming for grandmaster-level play...",
  authors: [{ name: "Chesso Team", url: "https://chesso.com" }],
  creator: "Michael Mahumba",
  openGraph: {
    title: "Chesso | Chess Coaching for Beginners & Pros with AI",
    description: "From beginner to advanced, Chesso uses AI and Stockfish...",
    url: "https://chesso.com",
    siteName: "Chesso",
    images: [
      {
        url: "https://chesso.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Chesso AI Chess Coach",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chesso | Chess Coaching for Beginners & Pros with AI",
    description: "From beginner to advanced, Chesso uses AI and Stockfish...",
    images: ["https://chesso.com/og-image.png"],
    creator: "@ChessoAI",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  themeColor: "#ffffff",
  viewport: { width: "device-width", initialScale: 1 },
};



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
