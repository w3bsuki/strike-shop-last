import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import type { Metadata } from "next"
import CartSidebar from "@/components/cart-sidebar"
import { Providers } from "@/components/providers"
import { Toaster } from "@/components/ui/toaster"
import { SkipLink } from "@/components/accessibility/skip-link"
import { LiveRegionProvider } from "@/components/accessibility/live-region"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "STRIKE™",
  description: "Luxury streetwear brand",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SkipLink />
        <Providers>
          <LiveRegionProvider>
            <main id="main-content" tabIndex={-1}>
              {children}
            </main>
            <CartSidebar />
            <Toaster />
          </LiveRegionProvider>
        </Providers>
      </body>
    </html>
  )
}
