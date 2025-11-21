'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Shield, Zap, Heart, Code, Lock, Globe } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: 'Built for Speed',
      description: 'No waiting for uploads or downloads to a server. By processing files directly in your browser using modern web technologies like WebAssembly, we offer unparalleled speed for all our tools.',
      color: 'bg-yellow-100 text-yellow-600'
    },
    {
      icon: Heart,
      title: 'Completely Free',
      description: 'No trials, no subscriptions, no hidden fees, and no "premium" features held hostage. We believe powerful PDF tools should be a public utility, not a profit center.',
      color: 'bg-pink-100 text-pink-600'
    },
    {
      icon: Lock,
      title: 'No Account Required',
      description: 'Start using any tool immediately. We don\'t need your email, a password, or any personal information. Your workflow should be frictionless and anonymous.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: Code,
      title: 'Open Source Spirit',
      description: 'Built with transparency in mind. We leverage incredible open-source libraries like PDF-lib and PDF.js, and believe in the community-driven effort to make powerful tools accessible to everyone.',
      color: 'bg-blue-100 text-blue-600'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
              style={{
                left: `${(i * 7 + 10) % 100}%`,
                top: `${(i * 13 + 20) % 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6"
            >
              <Globe className="w-4 h-4" />
              About PDF Toolkit
            </motion.div>

            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              We believe PDF tools should be{' '}
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                fast, private, and free.
              </span>
            </h1>
            <p className="text-2xl text-gray-700 font-medium mb-4">
              No compromises.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">
              Our Mission
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed text-center">
              To provide the most comprehensive PDF toolbox that respects your privacy and never asks for payment. 
              We believe essential document tools should be accessible to everyone, everywhere, without barriers.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Our Core Philosophy
              </h2>
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-100 rounded-full">
                <Shield className="w-6 h-6 text-green-600" />
                <span className="text-xl font-semibold text-green-700">
                  Privacy First. Always.
                </span>
              </div>
            </div>

            <Card className="border-2 border-green-200 shadow-lg">
              <CardContent className="p-8 md:p-12">
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  In an era where data is a commodity, we take a different approach. All processing for PDF Toolkit 
                  happens locally in your browser. This means your files never touch our servers, we never see your 
                  documents, and we don't track what you do.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Your documents remain <strong>completely and unequivocally private</strong>. It's not just a 
                  feature; it's our foundation.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Why PDF Toolkit Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why PDF Toolkit?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              We've built something different. Here's what makes us stand out.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {values.map((value, index) => {
              const IconComponent = value.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full border-2 hover:border-blue-200 hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-8">
                      <motion.div
                        className={`w-14 h-14 rounded-xl ${value.color} flex items-center justify-center mb-6`}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        <IconComponent className="w-7 h-7" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">
                        {value.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{ 
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Ready to experience the difference?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of users who trust PDF Toolkit for their document needs.
            </p>
            <Link href="/tools">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-10 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
              >
                Start Using PDF Toolkit
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
