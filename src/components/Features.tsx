'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Shield,
  Trash2,
  Lock
} from 'lucide-react'

const features = [
  {
    title: 'No File Storage',
    description: 'Your uploaded files are NOT saved anywhere. All processing happens in memory and files are immediately discarded after processing.',
    icon: Trash2,
    color: 'bg-blue-100 text-blue-600'
  },
  {
    title: 'Privacy First',
    description: 'Files are received in memory, processed instantly, and returned to your browser. No database, no storage folder, no server disk storage.',
    icon: Shield,
    color: 'bg-green-100 text-green-600'
  },
  {
    title: 'Secure Processing',
    description: 'All PDF processing happens through serverless functions. Your documents are never stored or logged anywhere on our servers.',
    icon: Lock,
    color: 'bg-purple-100 text-purple-600'
  }
]

export default function Features() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Your Privacy Matters
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            We process your PDFs with <strong>complete privacy</strong>. No storage, no tracking, no data collection.
          </p>
          <div className="mt-4">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium">
              <span className="animate-pulse">✨</span>
              AI Features Coming Soon
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group"
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md group-hover:shadow-xl">
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}