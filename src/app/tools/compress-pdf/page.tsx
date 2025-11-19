'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Minimize2, Download, Settings, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import { compressPDF } from '@/lib/pdfCompression'

interface CompressionResult {
  success: boolean
  originalSize: number
  compressedSize: number
  compressionRatio: number
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

  const [progress, setProgress] = useState(0)
  const [progressStatus, setProgressStatus] = useState('')

  const mapLevelToPreset = (level: 'low' | 'medium' | 'high'): 'high-quality' | 'balanced' | 'small-size' => {
    if (level === 'low') return 'high-quality'
    if (level === 'medium') return 'balanced'
    return 'small-size'
  }

  const handleCompress = async () => {
    if (!uploadedFile) return
    setIsProcessing(true)
    setResult(null)
    setProgressStatus('Using Ghostscript server compression...')
    setProgress(0)
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('compressionLevel', compressionLevel)
      const response = await fetch('/api/compress', { method: 'POST', body: formData })

      if (response.ok) {
        const originalSize = Number(response.headers.get('X-Original-Size') || '0')
        const compressedSize = Number(response.headers.get('X-Compressed-Size') || '0')
        const ratioHeader = response.headers.get('X-Compression-Ratio') || '0'
        const compressionRatio = Number(ratioHeader) // percentage
        const blob = await response.blob()

        // If user selected high and reduction is small (<8%), attempt second pass client recompression
        if (compressionLevel === 'high' && compressionRatio < 8 && compressedSize < originalSize) {
          setProgressStatus('Running extra image recompression pass in browser...')
          setProgress(10)
          const intermediateFile = new File([blob], `server-compressed-${uploadedFile.name}`, { type: 'application/pdf' })
          const preset = mapLevelToPreset('high')
          const res = await compressPDF(
            intermediateFile,
            preset,
            'smart',
            (p, status) => {
              // scale progress 10-95
              const scaled = 10 + (p * 0.85)
              setProgress(Math.min(95, Math.round(scaled)))
              setProgressStatus(status)
            }
          )
          const finalBlob = new Blob([res.compressedBytes as unknown as BlobPart], { type: 'application/pdf' })
          const finalUrl = URL.createObjectURL(finalBlob)
          setResult({
            success: true,
            originalSize: res.originalSize, // original of second pass input
            compressedSize: res.compressedSize,
            compressionRatio: res.compressionRatio,
            downloadUrl: finalUrl
          })
          setProgress(100)
          setProgressStatus('Multi-pass compression complete')
        } else {
          const url = URL.createObjectURL(blob)
          setResult({
            success: true,
            originalSize,
            compressedSize,
            compressionRatio,
            downloadUrl: url
          })
          setProgress(100)
          setProgressStatus('Server compression complete')
        }
      } else {
        // Fallback to client-side compression
        setProgressStatus('Ghostscript unavailable. Falling back to local browser compression...')
        const preset = mapLevelToPreset(compressionLevel)
        const res = await compressPDF(
          uploadedFile,
          preset,
          'auto',
          (p, status) => {
            setProgress(p)
            setProgressStatus(status)
          }
        )
        const blob = new Blob([res.compressedBytes as unknown as BlobPart], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setResult({
          success: true,
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          compressionRatio: res.compressionRatio,
          downloadUrl: url
        })
        setProgress(100)
        setProgressStatus('Local compression complete')
      }
    } catch (e) {
      console.error('Compression error:', e)
      try {
        // Attempt client fallback if server path threw before response.ok check
        setProgressStatus('Error on server. Attempting local compression...')
        const preset = mapLevelToPreset(compressionLevel)
        const res = await compressPDF(
          uploadedFile,
          preset,
          'auto',
          (p, status) => {
            setProgress(p)
            setProgressStatus(status)
          }
        )
        const blob = new Blob([res.compressedBytes as unknown as BlobPart], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        setResult({
          success: true,
          originalSize: res.originalSize,
          compressedSize: res.compressedSize,
          compressionRatio: res.compressionRatio,
          downloadUrl: url
        })
        setProgress(100)
        setProgressStatus('Local compression complete')
      } catch (fallbackErr) {
        console.error('Fallback compression failed:', fallbackErr)
        alert('Compression failed: ' + (fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error'))
      }
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
              <p className="text-gray-600">Reduce PDF file size. Uses Ghostscript on server when available, otherwise compresses privately in-browser.</p>
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
                            { value: 'low', label: 'Low', desc: 'Best quality, larger file' },
                            { value: 'medium', label: 'Medium', desc: 'Balanced size & quality' },
                            { value: 'high', label: 'High', desc: 'Smaller file, more compression' }
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