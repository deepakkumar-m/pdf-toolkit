'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Merge, Download, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

export default function MergePdfPage() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [mergedPdf, setMergedPdf] = useState<string | null>(null)

  const handleFilesUploaded = (files: File[]) => {
    setUploadedFiles(files)
  }

  const handleMergePdfs = async () => {
    if (uploadedFiles.length < 2) {
      alert('Please upload at least 2 PDF files to merge')
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setMergedPdf(url)
      } else {
        throw new Error('Failed to merge PDFs')
      }
    } catch (error) {
      console.error('Error merging PDFs:', error)
      alert('Failed to merge PDFs. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadMergedPdf = () => {
    if (mergedPdf) {
      const a = document.createElement('a')
      a.href = mergedPdf
      a.download = 'merged-document.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
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
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Merge className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Merge PDF</h1>
              <p className="text-gray-600">Combine multiple PDF files into one document</p>
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
                  <Merge className="w-5 h-5 text-indigo-600" />
                  Upload PDF Files to Merge
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFilesUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={10}
                  toolType="PDF Merge"
                />
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">
                        {uploadedFiles.length} file(s) ready to merge
                      </span>
                    </div>
                    
                    <Button
                      onClick={handleMergePdfs}
                      disabled={isProcessing || uploadedFiles.length < 2}
                      className="w-full sm:w-auto"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Merging PDFs...
                        </>
                      ) : (
                        <>
                          <Merge className="w-4 h-4 mr-2" />
                          Merge PDF Files
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {mergedPdf && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">✓ Merge Complete!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Your PDFs have been successfully merged into a single document.
                    </p>
                    <Button onClick={downloadMergedPdf} size="lg">
                      <Download className="w-4 h-4 mr-2" />
                      Download Merged PDF
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Use Our PDF Merge Tool?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Fast & Secure',
                  description: 'Merge PDFs instantly with bank-level security. Your files are processed securely and deleted after use.',
                  icon: '🔒'
                },
                {
                  title: 'Preserve Quality',
                  description: 'Maintain original document quality and formatting. No compression or quality loss during merging.',
                  icon: '✨'
                },
                {
                  title: 'Any Order',
                  description: 'Arrange your PDFs in any order before merging. Drag and drop to reorder files as needed.',
                  icon: '📑'
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
          </motion.div>
        </div>
      </div>
    </div>
  )
}