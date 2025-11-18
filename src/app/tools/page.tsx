'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { 
  FileText, 
  Download, 
  Merge, 
  Minimize2, 
  Edit3, 
  Eye, 
  MessageSquare, 
  Scan, 
  Lock,
  Unlock, 
  RotateCw, 
  Scissors, 
  Image,
  ArrowLeft
} from 'lucide-react'

const allTools = [
  // 1) Merge PDF
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDF files into a single document in your preferred order',
    icon: Merge,
    color: 'bg-indigo-100 text-indigo-600',
    category: 'Organize',
    popular: true
  },
  // 2) Split PDF
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Extract specific pages or split PDF into separate documents',
    icon: Scissors,
    color: 'bg-teal-100 text-teal-600',
    category: 'Organize'
  },
  // 3) Compress PDF
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce PDF file size without compromising quality using advanced compression',
    icon: Minimize2,
    color: 'bg-red-100 text-red-600',
    category: 'Optimize',
    popular: true
  },
  // Remaining tools
  {
    id: 'chat-pdf',
    title: 'Chat with PDF',
    description: 'AI-powered document analysis. Ask questions about your PDF content and get intelligent answers',
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600',
    category: 'AI Tools',
    popular: true,
    comingSoon: true
  },
  {
    id: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text, images, shapes, and annotations to your PDF documents online',
    icon: Edit3,
    color: 'bg-green-100 text-green-600',
    category: 'Edit',
    popular: true,
    comingSoon: true
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Convert PDF pages to high-quality JPG images for easy sharing',
    icon: Image,
    color: 'bg-pink-100 text-pink-600',
    category: 'Convert'
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Microsoft Word documents to PDF format instantly',
    icon: Download,
    color: 'bg-emerald-100 text-emerald-600',
    category: 'Convert',
    comingSoon: true
  },
  {
    id: 'ocr-pdf',
    title: 'OCR PDF',
    description: 'Extract text from scanned PDFs and images using advanced OCR technology',
    icon: Scan,
    color: 'bg-orange-100 text-orange-600',
    category: 'Convert'
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Add password protection and encryption to secure your PDF documents',
    icon: Lock,
    color: 'bg-gray-100 text-gray-600',
    category: 'Security'
  },
  {
    id: 'decrypt-pdf',
    title: 'Decrypt PDF',
    description: 'Remove password protection from encrypted PDF files instantly',
    icon: Unlock,
    color: 'bg-green-100 text-green-600',
    category: 'Security'
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Rotate PDF pages to correct orientation and improve readability',
    icon: RotateCw,
    color: 'bg-yellow-100 text-yellow-600',
    category: 'Edit'
  },
  {
    id: 'view-pdf',
    title: 'View PDF',
    description: 'Online PDF viewer with zoom, search, and navigation features',
    icon: Eye,
    color: 'bg-cyan-100 text-cyan-600',
    category: 'View'
  }
]

const categories = ['All', 'Convert', 'Edit', 'Organize', 'AI Tools', 'Optimize', 'Security', 'View']

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Home
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">All PDF Tools</h1>
          <p className="text-gray-600 mt-2">
            Professional PDF processing tools for all your document needs
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === 'All' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allTools
            .slice()
            .sort((a: any, b: any) => (a.comingSoon ? 1 : 0) - (b.comingSoon ? 1 : 0))
            .map((tool, index) => {
            const IconComponent = tool.icon
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                {tool.comingSoon ? (
                  <Card className="h-full opacity-60 cursor-not-allowed transition-all duration-300 border-2 relative group" aria-disabled>
                    {tool.popular && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                        Popular
                      </div>
                    )}
                    <div className="absolute -top-2 -left-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full font-medium z-10">
                      Coming Soon
                    </div>
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      
                      <div className="mb-3">
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {tool.category}
                        </span>
                      </div>
                      
                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {tool.description}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Link href={`/tools/${tool.id}`}>
                    <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200 relative group">
                      {tool.popular && (
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
                          Popular
                        </div>
                      )}
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        
                        <div className="mb-3">
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {tool.category}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {tool.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}