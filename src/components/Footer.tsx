// 
'use client'

import Image from 'next/image'
import { Github, Linkedin, Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12">
      <div className="container mx-auto px-4">
        {/* Author Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4 h-28 w-28 rounded-full overflow-hidden border-4 border-gray-700">
            <Image
              src="/author.png"
              alt="Profile photo"
              width={112}
              height={112}
              className="object-cover w-full h-full object-center"
              priority
            />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Created by Deepak</h3>
          <p className="text-gray-400 text-sm text-center max-w-md mb-4">
            Full-stack developer passionate about building useful tools for everyone
          </p>
          
          {/* Social Links */}
          <div className="flex gap-4">
            <a
              href="https://github.com/deepakkumar-m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://linkedin.com/in/deepakkumar-m"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="deepakkumarmanivannan@hotmail.com"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex justify-center items-center">
            <p className="text-gray-400 text-sm">
              © 2025 PDF Toolkit. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
