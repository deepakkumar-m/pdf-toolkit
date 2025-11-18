import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PDF Toolkit - Free Online PDF Tools',
  description: 'Professional PDF toolkit for converting, editing, merging, compressing, and processing PDF documents online. Fast, secure, and privacy-focused.',
  keywords: 'PDF, convert, edit, merge, compress, split, rotate, protect, OCR, document processing, free PDF tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}