'use client'

import './globals.css'
import { Manrope, Raleway } from 'next/font/google'
import { useEffect, useState } from 'react'

// Body font - clean, modern, professional
const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

// Display font - bold, impactful headlines
const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
  weight: ['400', '600', '700', '800', '900'],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for dark mode preference
    if (localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <html lang="en" suppressHydrationWarning className={`${manrope.variable} ${raleway.variable}`}>
      <body className={`min-h-screen bg-playful ${mounted ? '' : 'invisible'}`}>
        {/* Decorative blobs */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        {children}
      </body>
    </html>
  )
}
