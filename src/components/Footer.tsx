// 
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Github, Linkedin, Mail, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 relative overflow-hidden">
      {/* Animated background elements */}
      <motion.div
        className="absolute inset-0 opacity-10"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(168, 85, 247, 0.3) 0%, transparent 50%)',
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.3) 0%, transparent 50%)',
          ]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Author Section */}
        <motion.div 
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Animated profile image with glow and rotation */}
          <motion.div 
            className="relative mb-4 h-28 w-28 rounded-full overflow-hidden border-4 border-gray-700"
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ 
              duration: 1,
              type: "spring",
              stiffness: 100,
              delay: 0.2
            }}
            whileHover={{ 
              scale: 1.1,
              rotate: 5,
              borderColor: "#3b82f6",
              transition: { duration: 0.3 }
            }}
          >
            {/* Glowing ring animation */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-blue-500"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            
            {/* Sparkle effect */}
            <motion.div
              className="absolute -top-1 -right-1 text-yellow-400"
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-6 h-6" />
            </motion.div>

            <Image
              src="/author.png"
              alt="Profile photo"
              width={112}
              height={112}
              className="object-cover w-full h-full object-center"
              priority
            />
          </motion.div>

          {/* Animated name with gradient */}
          <motion.h3 
            className="text-xl font-semibold text-white mb-2"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <motion.span
              className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              Created by Deepak
            </motion.span>
          </motion.h3>

          {/* Animated description */}
          <motion.p 
            className="text-gray-400 text-sm text-center max-w-md mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Full-stack developer passionate about building useful tools for everyone
          </motion.p>
          
          {/* Social Links with stagger animation */}
          <motion.div 
            className="flex gap-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {[
              { href: "https://github.com/deepakkumar-m", Icon: Github, label: "GitHub", color: "hover:text-gray-100" },
              { href: "https://linkedin.com/in/deepakkumar-m", Icon: Linkedin, label: "LinkedIn", color: "hover:text-blue-400" },
              { href: "mailto:deepakkumarmanivannan@hotmail.com", Icon: Mail, label: "Email", color: "hover:text-purple-400" }
            ].map(({ href, Icon, label, color }, index) => (
              <motion.a
                key={label}
                href={href}
                target={label !== "Email" ? "_blank" : undefined}
                rel={label !== "Email" ? "noopener noreferrer" : undefined}
                className={`text-gray-400 ${color} transition-colors`}
                aria-label={label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.7 + index * 0.1 
                }}
                whileHover={{ 
                  scale: 1.3,
                  y: -5,
                  transition: { duration: 0.2 }
                }}
                whileTap={{ scale: 0.9 }}
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            ))}
          </motion.div>
        </motion.div>

        {/* Divider */}
        <motion.div 
          className="border-t border-gray-800 pt-8"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          {/* Company Info and Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h3 className="text-white font-semibold text-lg mb-3">PDF Toolkit</h3>
              <p className="text-gray-400 text-sm mb-2">Version 1.1</p>
              <p className="text-gray-400 text-sm">
                Professional PDF tools for everyone
              </p>
            </motion.div>

            {/* Company Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 1.1 }}
            >
              <h3 className="text-white font-semibold text-sm mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="text-gray-400 hover:text-white text-sm transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    FAQ
                  </a>
                </li>
                <li>
                  <a href="mailto:deepakkumarmanivannan@hotmail.com" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Contact Us
                  </a>
                </li>
              </ul>
            </motion.div>

            {/* Legal Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h3 className="text-white font-semibold text-sm mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Licensing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Terms and Conditions
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">
                    Privacy Policy
                  </a>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Copyright */}
          <div className="flex justify-center items-center pt-6 border-t border-gray-800">
            <motion.p 
              className="text-gray-400 text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              © 2025 PDF Toolkit. All rights reserved.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}
