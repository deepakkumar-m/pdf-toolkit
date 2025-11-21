'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Upload, Sparkles, Shield, Zap, Lock, FileCheck } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Hero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const floatingIcons = [
    { Icon: FileCheck, delay: 0, x: 100, y: 50 },
    { Icon: Lock, delay: 0.5, x: -80, y: 80 },
    { Icon: Zap, delay: 1, x: 120, y: -60 },
  ]

  // Fixed particle positions (deterministic, not random)
  const particles = [
    { left: 10, top: 20, duration: 3.2, delay: 0.1 },
    { left: 25, top: 80, duration: 4.1, delay: 0.3 },
    { left: 35, top: 45, duration: 3.7, delay: 0.5 },
    { left: 50, top: 15, duration: 4.5, delay: 0.2 },
    { left: 65, top: 70, duration: 3.9, delay: 0.7 },
    { left: 75, top: 35, duration: 4.2, delay: 0.4 },
    { left: 85, top: 60, duration: 3.5, delay: 0.9 },
    { left: 15, top: 55, duration: 4.3, delay: 0.6 },
    { left: 45, top: 85, duration: 3.8, delay: 1.1 },
    { left: 55, top: 25, duration: 4.0, delay: 0.8 },
    { left: 90, top: 40, duration: 3.6, delay: 1.0 },
    { left: 20, top: 65, duration: 4.4, delay: 0.2 },
    { left: 70, top: 10, duration: 3.3, delay: 1.2 },
    { left: 40, top: 75, duration: 4.1, delay: 0.5 },
    { left: 60, top: 50, duration: 3.9, delay: 0.7 },
    { left: 80, top: 20, duration: 4.2, delay: 0.3 },
    { left: 30, top: 90, duration: 3.7, delay: 0.9 },
    { left: 95, top: 55, duration: 4.5, delay: 0.4 },
    { left: 5, top: 30, duration: 3.4, delay: 1.1 },
    { left: 12, top: 42, duration: 4.3, delay: 0.6 },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 lg:py-32">
      {/* Animated background gradient */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-purple-400/10 to-pink-400/10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      />
      
      {/* Floating particles */}
      {mounted && particles.map((particle, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1]
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut'
          }}
        />
      ))}

      {/* Floating icons */}
      {floatingIcons.map(({ Icon, delay, x, y }, i) => (
        <motion.div
          key={i}
          className="absolute hidden lg:block"
          style={{ left: '50%', top: '50%' }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ 
            opacity: [0.3, 0.6, 0.3],
            x: [0, x, 0],
            y: [0, y, 0],
            rotate: [0, 360]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            delay,
            ease: 'easeInOut'
          }}
        >
          <Icon className="w-8 h-8 text-blue-400" />
        </motion.div>
      ))}
      
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full text-green-700 text-sm font-medium mb-6"
            animate={{ 
              boxShadow: [
                '0 0 0 0 rgba(34, 197, 94, 0)',
                '0 0 0 10px rgba(34, 197, 94, 0)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Shield className="w-4 h-4" />
            </motion.div>
            100% Private & Secure
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Professional PDF Toolkit
            <motion.span 
              className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent block"
              animate={{ 
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Fast, Free & Private
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Convert, edit, merge, compress, and manage your PDF documents with complete privacy. 
            All processing happens in your browser—no files stored, no data collected.
          </motion.p>
          
          <motion.div 
            className="flex flex-col items-center gap-3 justify-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link href="/tools">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  size="lg" 
                  className="text-xl px-12 py-7 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
                >
                  <Upload className="w-6 h-6 mr-3" />
                  Start Processing
                </Button>
              </motion.div>
            </Link>
            <motion.p 
              className="text-sm text-gray-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              Get started in seconds • No signup required
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05, color: '#059669' }}
            >
              <Shield className="w-4 h-4" />
              100% Private
            </motion.div>
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05, color: '#3b82f6' }}
            >
              <Upload className="w-4 h-4" />
              No File Storage
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, color: '#8b5cf6' }}
            >
              Free to Use
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}