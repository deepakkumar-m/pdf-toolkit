'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Upload, Sparkles, Shield } from 'lucide-react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            100% Private & Secure
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Professional PDF Toolkit
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              Fast, Free & Private
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Convert, edit, merge, compress, and manage your PDF documents with complete privacy. 
            All processing happens in your browser—no files stored, no data collected.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/tools">
              <Button size="lg" className="text-lg px-8">
                <Upload className="w-5 h-5 mr-2" />
                Start Processing
              </Button>
            </Link>
            <Link href="/tools">
              <Button variant="outline" size="lg" className="text-lg px-8">
                View All Tools
              </Button>
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              100% Private
            </div>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              No File Storage
            </div>
            <div>Free to Use</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}