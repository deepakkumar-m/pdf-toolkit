import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'PDF Toolkit - AI-Powered PDF Processing',
  description: 'Professional PDF toolkit with AI integration for converting, editing, merging, compressing, and processing PDF documents online.',
  keywords: 'PDF, convert, edit, merge, compress, AI, OCR, document processing',
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