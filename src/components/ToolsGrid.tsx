'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
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
  Image
} from 'lucide-react'

const tools = [
  // 1) Merge PDF
  {
    id: 'merge-pdf',
    title: 'Merge PDF',
    description: 'Combine multiple PDFs into one',
    icon: Merge,
    color: 'bg-indigo-100 text-indigo-600',
    popular: true
  },
  // 2) Split PDF
  {
    id: 'split-pdf',
    title: 'Split PDF',
    description: 'Extract pages from PDF documents',
    icon: Scissors,
    color: 'bg-teal-100 text-teal-600'
  },
  // 3) Compress PDF
  {
    id: 'compress-pdf',
    title: 'Compress PDF',
    description: 'Reduce file size without quality loss',
    icon: Minimize2,
    color: 'bg-red-100 text-red-600',
    popular: true
  },
  // Remaining tools
  {
    id: 'chat-pdf',
    title: 'Chat with PDF',
    description: 'AI-powered document analysis and Q&A',
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600',
    popular: true,
    comingSoon: true
  },
  {
    id: 'edit-pdf',
    title: 'Edit PDF',
    description: 'Add text, images, and annotations',
    icon: Edit3,
    color: 'bg-green-100 text-green-600',
    popular: true,
    comingSoon: true
  },
  {
    id: 'ocr',
    title: 'OCR',
    description: 'Extract text from scanned documents',
    icon: Scan,
    color: 'bg-orange-100 text-orange-600',
    comingSoon: true
  },
  {
    id: 'pdf-to-jpg',
    title: 'PDF to JPG',
    description: 'Convert PDF pages to images',
    icon: Image,
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 'rotate-pdf',
    title: 'Rotate PDF',
    description: 'Rotate PDF pages to correct orientation',
    icon: RotateCw,
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    id: 'protect-pdf',
    title: 'Protect PDF',
    description: 'Add password protection to PDFs',
    icon: Lock,
    color: 'bg-gray-100 text-gray-600'
  },
  {
    id: 'decrypt-pdf',
    title: 'Decrypt PDF',
    description: 'Remove password from encrypted PDFs',
    icon: Unlock,
    color: 'bg-green-100 text-green-600'
  },
  {
    id: 'view-pdf',
    title: 'View PDF',
    description: 'Online PDF viewer and reader',
    icon: Eye,
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Convert Word documents to PDF',
    icon: Download,
    color: 'bg-emerald-100 text-emerald-600',
    comingSoon: true
  }
]

export default function ToolsGrid() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Most Popular PDF Tools
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Professional PDF processing tools powered by AI. Convert, edit, and manipulate 
            your documents with industry-leading accuracy and speed.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tools
            .slice()
            .sort((a: any, b: any) => (a.comingSoon ? 1 : 0) - (b.comingSoon ? 1 : 0))
            .map((tool, index) => {
            const IconComponent = tool.icon
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group"
              >
                <Card 
                  className={`h-full transition-all duration-300 border-2 relative ${tool.comingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:border-blue-200'}`}
                  onClick={() => {
                    if (!tool.comingSoon) {
                      window.location.href = `/tools/${tool.id}`
                    }
                  }}
                  aria-disabled={tool.comingSoon ? true : undefined}
                >
                  {tool.popular && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  {tool.comingSoon && (
                    <div className="absolute -top-2 -left-2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded-full font-medium">
                      Coming Soon
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-lg ${tool.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tool.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="text-blue-600 hover:text-blue-700 font-medium text-lg hover:underline transition-colors">
            Explore All PDF Tools →
          </button>
        </motion.div>
      </div>
    </section>
  )
}