'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Lock, Unlock, Download, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

export default function DecryptPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [decryptedPdf, setDecryptedPdf] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setDecryptedPdf(null)
    setError(null)
  }

  const handleDecrypt = async () => {
    if (!uploadedFile) {
      setError('Please upload a PDF file')
      return
    }

    if (!password.trim()) {
      setError('Please enter the PDF password')
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('password', password)

      const response = await fetch('/api/decrypt', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setDecryptedPdf(url)
        setPassword('') // Clear password after successful decryption
      } else {
        const data = await response.json().catch(() => ({}))
        if (response.status === 401) {
          throw new Error('Incorrect password. Please try again.')
        } else {
          throw new Error(data.error || 'Failed to decrypt PDF')
        }
      }
    } catch (err: any) {
      console.error('Decrypt error:', err)
      setError(err?.message || 'Failed to decrypt PDF. Please check the password and try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadDecryptedPdf = () => {
    if (decryptedPdf) {
      const a = document.createElement('a')
      a.href = decryptedPdf
      a.download = `unlocked-${uploadedFile?.name || 'document.pdf'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing && uploadedFile && password.trim()) {
      handleDecrypt()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/tools" 
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Tools
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Unlock className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Decrypt PDF</h1>
              <p className="text-gray-600">Remove password protection from your PDF files</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-green-600" />
                  Upload Encrypted PDF
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="Decrypt PDF"
                />
                
                {uploadedFile && !decryptedPdf && (
                  <div className="mt-6">
                    <div className="mb-4">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        PDF Password
                      </label>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Enter PDF password"
                          className="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-600"
                          disabled={isProcessing}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-800">{error}</p>
                      </div>
                    )}
                    
                    <Button
                      onClick={handleDecrypt}
                      disabled={isProcessing || !password.trim()}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Decrypting...
                        </>
                      ) : (
                        <>
                          <Unlock className="w-4 h-4 mr-2" />
                          Decrypt PDF
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {decryptedPdf && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">✓ PDF Decrypted Successfully!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Your PDF has been successfully unlocked and is ready to download.
                    </p>
                    <Button onClick={downloadDecryptedPdf} size="lg">
                      <Download className="w-4 h-4 mr-2" />
                      Download Unlocked PDF
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Use Our PDF Decrypt Tool?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[
                {
                  title: 'Secure & Private',
                  description: 'Your files and passwords are processed securely and never stored. Everything happens in your browser or on secure servers.',
                  icon: '🔒'
                },
                {
                  title: 'Fast Decryption',
                  description: 'Quickly remove password protection from your PDFs. Get your unlocked file in seconds.',
                  icon: '⚡'
                },
                {
                  title: 'No Quality Loss',
                  description: 'The decrypted PDF maintains all original content, formatting, and quality without any changes.',
                  icon: '✨'
                }
              ].map((feature, index) => (
                <Card key={index}>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* How to Use */}
            <Card>
              <CardHeader>
                <CardTitle>How to Decrypt a PDF</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <span className="font-semibold text-green-600 min-w-[24px]">1.</span>
                    <p><strong>Upload your encrypted PDF:</strong> Click or drag and drop your password-protected PDF file.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-green-600 min-w-[24px]">2.</span>
                    <p><strong>Enter the password:</strong> Type the password that unlocks your PDF. You can click the eye icon to show/hide your password.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-green-600 min-w-[24px]">3.</span>
                    <p><strong>Decrypt:</strong> Click the &quot;Decrypt PDF&quot; button or press Enter. The tool will remove the password protection.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-green-600 min-w-[24px]">4.</span>
                    <p><strong>Download:</strong> Once decrypted, download your unlocked PDF. The file will no longer require a password to open.</p>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>💡 Note:</strong> You must know the correct password to decrypt the PDF. This tool cannot crack or bypass unknown passwords.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
