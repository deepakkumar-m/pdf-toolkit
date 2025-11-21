'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Minimize2, Download, Settings, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

interface CompressionResult {
  success: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: string
  downloadUrl: string
}

export default function CompressPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [compressionLevel, setCompressionLevel] = useState<'low' | 'medium' | 'high'>('medium')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<CompressionResult | null>(null)
  const [pdfInfo, setPdfInfo] = useState<any>(null)

  const handleFileUploaded = async (files: File[]) => {
    const file = files[0]
    setUploadedFile(file)
    
    // Get PDF info
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/info', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        setPdfInfo(data.info)
      }
    } catch (error) {
      console.error('Error getting PDF info:', error)
    }
  }

  const handleCompress = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('compressionLevel', compressionLevel)

      const response = await fetch('/api/compress', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        const originalSize = parseInt(response.headers.get('X-Original-Size') || '0')
        const compressedSize = parseInt(response.headers.get('X-Compressed-Size') || '0')
        const compressionRatio = response.headers.get('X-Compression-Ratio') || '0'
        
        setResult({
          success: true,
          originalSize,
          compressedSize,
          compressionRatio,
          downloadUrl: url
        })
      } else {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Compression failed')
      }
    } catch (error) {
      console.error('Error compressing PDF:', error)
      const msg = error instanceof Error ? error.message : 'Failed to compress PDF. Please try again.'
      alert(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadCompressed = () => {
    if (result?.downloadUrl) {
      const a = document.createElement('a')
      a.href = result.downloadUrl
      a.download = `compressed-${uploadedFile?.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Minimize2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Compress PDF</h1>
              <p className="text-gray-600">Reduce PDF file size without losing quality</p>
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
                  <Minimize2 className="w-5 h-5 text-red-600" />
                  Upload PDF to Compress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="PDF Compression"
                />
              </CardContent>
            </Card>

            {/* Settings Section */}
            {uploadedFile && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5 text-blue-600" />
                      Compression Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Compression Level */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Compression Level
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'low', label: 'Low', desc: 'Approx. 25% reduction (best quality)' },
                            { value: 'medium', label: 'Medium', desc: 'Approx. 50% reduction (balanced)' },
                            { value: 'high', label: 'High', desc: 'Approx. 75% reduction (smallest file)' }
                          ].map((level) => (
                            <div key={level.value} className="flex items-center">
                              <input
                                type="radio"
                                id={level.value}
                                name="compressionLevel"
                                value={level.value}
                                checked={compressionLevel === level.value}
                                onChange={(e) => setCompressionLevel(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-4 h-4 text-red-600 border-gray-300 focus:ring-red-500"
                              />
                              <label htmlFor={level.value} className="ml-3 block">
                                <div className="text-sm font-medium text-gray-900">{level.label}</div>
                                <div className="text-sm text-gray-500">{level.desc}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Algorithm selection removed – server (Ghostscript) is always used */}

                      {/* File Info */}
                      {pdfInfo && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            <Info className="inline w-4 h-4 mr-1" />
                            File Information
                          </label>
                          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>File Size:</span>
                              <span className="font-medium">{formatFileSize(pdfInfo.fileSize.bytes)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Pages:</span>
                              <span className="font-medium">{pdfInfo.pageCount}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dimensions:</span>
                              <span className="font-medium">
                                {pdfInfo.dimensions.average.width} × {pdfInfo.dimensions.average.height}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Progress UI removed – handled by server */}

                    <div className="mt-6">
                      <Button
                        onClick={handleCompress}
                        disabled={isProcessing}
                        className="w-full sm:w-auto"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Compressing...
                          </>
                        ) : (
                          <>
                            <Minimize2 className="w-4 h-4 mr-2" />
                            Compress PDF
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Result Section */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600">✓ Compression Complete!</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                            <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatFileSize(result.originalSize)}
                        </div>
                        <div className="text-sm text-gray-500">Original Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatFileSize(result.compressedSize)}
                        </div>
                        <div className="text-sm text-gray-500">Compressed Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Number(result.compressionRatio).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Reduction</div>
                      </div>
                    </div>
                    {Number(result.compressionRatio) <= 0 && (
                      <div className="mb-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-md p-3">
                        This PDF already appears optimally compressed at this level. The original file was returned unchanged.
                      </div>
                    )}

                    <Button onClick={downloadCompressed}>
                      <Download className="w-4 h-4 mr-2" />
                      Download Compressed PDF
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}