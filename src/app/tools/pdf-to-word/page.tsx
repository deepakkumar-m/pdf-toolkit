'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, FileText, Download, Sparkles, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

interface ConversionResult {
  success: boolean
  message: string
  convertedName: string
  downloadUrl?: string
  note?: string
}

export default function PdfToWordPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<ConversionResult | null>(null)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0])
    setResult(null)
  }

  const handleConvert = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('convertTo', 'word')

      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const contentType = response.headers.get('Content-Type')
        
        // Check if we got a Word document (binary) or JSON response
        if (contentType?.includes('wordprocessingml')) {
          // It's a Word document - download it directly
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'converted.docx'
          
          // Automatically download the file
          const a = document.createElement('a')
          a.href = url
          a.download = filename
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          const pageCount = response.headers.get('X-Page-Count') || 'unknown'
          const charCount = response.headers.get('X-Char-Count') || 'unknown'
          
          setResult({
            success: true,
            message: `Successfully converted ${pageCount} page(s) with ${charCount} characters to Word format`,
            convertedName: filename,
            note: 'Your Word document has been downloaded. You can now edit it in Microsoft Word, Google Docs, or any compatible word processor.'
          })
        } else {
          // It's a JSON response (error or demo message)
          const data = await response.json()
          if (data.success) {
            setResult(data)
          } else {
            throw new Error(data.error || 'Conversion failed')
          }
        }
      } else {
        const data = await response.json()
        throw new Error(data.error || 'Conversion failed')
      }
    } catch (error) {
      console.error('Error converting PDF:', error)
      alert(`Failed to convert PDF to Word: ${error instanceof Error ? error.message : 'Please try again.'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadConverted = () => {
    // File is already downloaded automatically after conversion
    alert('The Word document has already been downloaded to your computer. Check your downloads folder!')
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
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PDF to Word</h1>
              <p className="text-gray-600">Convert PDF files to editable Word documents</p>
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
            {/* Upload Section */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Upload PDF File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="PDF to Word Conversion"
                />
                
                {uploadedFile && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Ready to Convert</span>
                    </div>
                    <p className="text-blue-600 text-sm mb-4">
                      {uploadedFile.name} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    
                    <Button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Converting to Word...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Convert to Word
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Result Section */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Conversion Complete!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">{result.message}</p>
                      
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium text-green-900">
                              {result.convertedName}
                            </p>
                            <p className="text-sm text-green-600">
                              ✓ Downloaded to your computer
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {result.note && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">
                            <strong>Note:</strong> {result.note}
                          </p>
                        </div>
                      )}
                    </div>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Why Convert PDF to Word?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: 'Editable Text',
                  description: 'Convert PDFs to fully editable Word documents. Modify text, formatting, and layout easily.',
                  icon: '✏️'
                },
                {
                  title: 'Preserve Layout',
                  description: 'Maintain original document structure, fonts, and formatting during conversion.',
                  icon: '📐'
                },
                {
                  title: 'High Accuracy',
                  description: 'AI-powered conversion ensures maximum accuracy in text recognition and layout preservation.',
                  icon: '🎯'
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

          {/* Conversion Tips */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12"
          >
            <Card>
              <CardHeader>
                <CardTitle>💡 Conversion Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Best Results</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Use high-quality, text-based PDFs</li>
                      <li>• Avoid scanned or image-heavy documents</li>
                      <li>• Standard fonts convert better</li>
                      <li>• Simple layouts work best</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">After Conversion</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Review formatting carefully</li>
                      <li>• Check tables and images</li>
                      <li>• Adjust margins if needed</li>
                      <li>• Save in your preferred format</li>
                    </ul>
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