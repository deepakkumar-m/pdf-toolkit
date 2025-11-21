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
          <motion.div 
            className="mt-4"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium"
              animate={{ 
                boxShadow: [
                  '0 0 0 0 rgba(168, 85, 247, 0.4)',
                  '0 0 0 15px rgba(168, 85, 247, 0)',
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <motion.span
                animate={{ 
                  rotate: [0, 15, -15, 0],
                  scale: [1, 1.3, 1]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                ✨
              </motion.span>
              AI Features Coming Soon
            </motion.span>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50, rotateY: 45 }}
                whileInView={{ opacity: 1, x: 0, rotateY: 0 }}
                transition={{ 
                  duration: 0.7, 
                  delay: index * 0.15,
                  type: 'spring',
                  stiffness: 80
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10,
                  rotateY: 5,
                  transition: { duration: 0.3 }
                }}
                className="group"
                style={{ perspective: '1000px' }}
              >
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md group-hover:shadow-xl group-hover:border-blue-200 border-2 border-transparent relative overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 opacity-0 group-hover:opacity-100"
                    transition={{ duration: 0.3 }}
                  />
                  <CardContent className="p-8 relative z-10">
                    <motion.div 
                      className={`w-14 h-14 rounded-xl ${feature.color} flex items-center justify-center mb-6 relative`}
                      whileHover={{ 
                        scale: 1.2,
                        rotate: 360,
                        transition: { duration: 0.6 }
                      }}
                    >
                      <IconComponent className="w-7 h-7" />
                      <motion.div
                        className="absolute inset-0 rounded-xl bg-white"
                        initial={{ scale: 0 }}
                        whileHover={{ 
                          scale: 1.5,
                          opacity: [0, 0.5, 0],
                          transition: { duration: 0.5 }
                        }}
                      />
                    </motion.div>
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