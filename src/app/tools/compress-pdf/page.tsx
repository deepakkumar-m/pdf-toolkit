'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Minimize2, Download, Settings, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import { compressPDF, CompressionLevel } from '@/lib/pdfCompression'

interface CompressionResult {
  success: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: number
  downloadUrl: string
  method: string
}

export default function CompressPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [compressionLevel, setCompressionLevel] = useState<CompressionLevel>('balanced')
  const [algorithm, setAlgorithm] = useState<'auto' | 'smart' | 'photon'>('auto')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')
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
    setProgress(0)
    setProgressStatus('Starting compression...')
    setResult(null)

    try {
      const compressionResult = await compressPDF(
        uploadedFile,
        compressionLevel,
        algorithm,
        (prog, status) => {
          setProgress(prog)
          setProgressStatus(status)
        }
      )

      const blob = new Blob([compressionResult.compressedBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      setResult({
        success: true,
        originalSize: compressionResult.originalSize,
        compressedSize: compressionResult.compressedSize,
        compressionRatio: compressionResult.compressionRatio,
        downloadUrl: url,
        method: compressionResult.method,
      })
      
      setProgress(100)
      setProgressStatus('Compression complete!')
    } catch (error) {
      console.error('Error compressing PDF:', error)
      alert('Failed to compress PDF. Please try again.')
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
                            { value: 'high-quality', label: 'High Quality', desc: 'Best quality, larger file' },
                            { value: 'balanced', label: 'Balanced', desc: 'Great balance of quality and size' },
                            { value: 'small-size', label: 'Small Size', desc: 'Smaller file, good quality' },
                            { value: 'extreme', label: 'Extreme', desc: 'Maximum compression' }
                          ].map((level) => (
                            <div key={level.value} className="flex items-center">
                              <input
                                type="radio"
                                id={level.value}
                                name="compressionLevel"
                                value={level.value}
                                checked={compressionLevel === level.value}
                                onChange={(e) => setCompressionLevel(e.target.value as CompressionLevel)}
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

                      {/* Algorithm */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Compression Algorithm
                        </label>
                        <div className="space-y-3">
                          {[
                            { value: 'auto', label: 'Automatic', desc: 'Best method chosen automatically' },
                            { value: 'smart', label: 'Smart (Vector)', desc: 'Keeps PDF as vector, compresses images' },
                            { value: 'photon', label: 'Photon (Raster)', desc: 'Converts to images, higher compression' }
                          ].map((algo) => (
                            <div key={algo.value} className="flex items-center">
                              <input
                                type="radio"
                                id={algo.value}
                                name="algorithm"
                                value={algo.value}
                                checked={algorithm === algo.value}
                                onChange={(e) => setAlgorithm(e.target.value as typeof algorithm)}
                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                              />
                              <label htmlFor={algo.value} className="ml-3 block">
                                <div className="text-sm font-medium text-gray-900">{algo.label}</div>
                                <div className="text-sm text-gray-500">{algo.desc}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

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

                    {isProcessing && (
                      <div className="mt-6 bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">{progressStatus}</span>
                          <span className="text-sm font-medium text-blue-600">{progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    )}

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
                          {result.compressionRatio.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-500">Reduction</div>
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-800">
                        <strong>Method used:</strong> {result.method.replace('-', ' - ').toUpperCase()}
                      </p>
                    </div>

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