import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  weight: ['400', '500'],
})

const fundName = process.env.FUND_NAME ?? 'Hudson Capital'
const fundAccentColor = process.env.FUND_ACCENT_COLOR ?? '#3b82f6'

export const metadata: Metadata = {
  title: `${fundName} - LP Portal`,
  description: `Investor portal for ${fundName}`,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      style={{ '--fund-accent': fundAccentColor } as React.CSSProperties}
    >
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-accent focus:text-white"
        >
          Skip to content
        </a>
        <main id="main-content">{children}</main>
      </body>
    </html>
  )
}
