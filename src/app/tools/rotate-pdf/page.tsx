"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { RotateCw, ArrowLeft, CheckCircle, RotateCcw, AlertCircle, Info, ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import { Document, Page, pdfjs } from 'react-pdf'

// Use CDN worker to avoid bundler quirks
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

 type Selection = 'all' | 'even' | 'odd' | 'ranges'

export default function RotatePdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [preview, setPreview] = useState(true)
  const [numPages, setNumPages] = useState<number>(0)
  const [scale, setScale] = useState<number>(1)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setPageRotations({})
    setPreview(true)
  }

  const rotatePageBy = (pageIndex: number, delta: number) => {
    setPageRotations(prev => ({
      ...prev,
      [pageIndex]: (prev[pageIndex] || 0) + delta
    }))
  }

  const handleRotate = async () => {
    if (!uploadedFile) return

    const hasRotations = Object.values(pageRotations).some(r => r !== 0)
    if (!hasRotations) {
      alert('Please rotate at least one page before saving.')
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('pageRotations', JSON.stringify(pageRotations))

      const res = await fetch('/api/rotate', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to rotate PDF')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `rotated-${uploadedFile.name}`

      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Rotate error:', err)
      alert(err?.message || 'Failed to rotate PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/tools" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Tools
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <RotateCw className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rotate PDF</h1>
              <p className="text-gray-600">Rotate your PDF pages in just a few clicks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Upload */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RotateCw className="w-5 h-5 text-yellow-600" />
                  Upload PDF to Rotate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="Rotate PDF"
                />
              </CardContent>
            </Card>

            {/* Options */}
            {uploadedFile && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Rotation Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">Click the arrow buttons on each page below to rotate it. Each click rotates by 90°.</p>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center">
                    <div className="flex items-center gap-2">
                      <input
                        id="preview"
                        type="checkbox"
                        checked={preview}
                        onChange={(e) => setPreview(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <label htmlFor="preview" className="text-sm text-gray-700">Enable Preview</label>
                    </div>

                    <Button onClick={handleRotate} disabled={isProcessing} size="lg" className="w-full sm:w-auto">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Rotating...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Rotate PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Preview */}
            {uploadedFile && preview && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <RotateCw className="w-5 h-5 text-yellow-600" />
                    Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Document
                      file={uploadedFile}
                      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                      loading={<div className="text-sm text-gray-500">Loading preview…</div>}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: numPages || 0 }).map((_, idx) => {
                          const pageNumber = idx + 1
                          const angle = pageRotations[idx] || 0
                          return (
                            <div key={pageNumber} className="flex flex-col items-center">
                              <div className="mb-3 flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Page {pageNumber}</span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => rotatePageBy(idx, 90)}
                                  className="h-8 w-8"
                                  title="Rotate clockwise"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => rotatePageBy(idx, -90)}
                                  className="h-8 w-8"
                                  title="Rotate counterclockwise"
                                >
                                  <RotateCw className="w-4 h-4" />
                                </Button>
                                {angle !== 0 && (
                                  <span className="text-xs text-yellow-600 font-medium">({angle}°)</span>
                                )}
                              </div>
                              <div
                                className="relative border rounded-md bg-white p-4 shadow-sm flex items-center justify-center"
                                style={{
                                  minHeight: '500px',
                                  minWidth: '100%',
                                }}
                              >
                                <div
                                  style={{
                                    transform: `rotate(${angle}deg)`,
                                    transformOrigin: 'center',
                                  }}
                                >
                                  <Page pageNumber={pageNumber} scale={scale} width={440} renderAnnotationLayer={false} renderTextLayer={false} />
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Document>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Features */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Why Use Our PDF Rotate Tool?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: 'Rotate Any Page',
                      description: 'Rotate individual pages or all pages at once. Each page can be rotated independently to your desired orientation.',
                      icon: '🔄'
                    },
                    {
                      title: 'Quick & Easy',
                      description: 'Simple click-to-rotate interface. No complicated settings - just click the arrows to rotate pages by 90 degrees.',
                      icon: '⚡'
                    },
                    {
                      title: 'Preview Before Save',
                      description: 'See exactly how your PDF will look before downloading. Make adjustments until everything is perfect.',
                      icon: '👁️'
                    }
                  ].map((feature, index) => (
                    <div key={index} className="text-center">
                      <div className="text-3xl mb-3">{feature.icon}</div>
                      <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>How to Rotate PDF Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex gap-3">
                    <span className="font-semibold text-yellow-600 min-w-[24px]">1.</span>
                    <p><strong>Upload your PDF:</strong> Click or drag and drop your PDF file into the upload area.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-yellow-600 min-w-[24px]">2.</span>
                    <p><strong>Rotate pages:</strong> Use the left and right arrow buttons next to each page to rotate. Each click rotates the page by 90 degrees.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-yellow-600 min-w-[24px]">3.</span>
                    <p><strong>Preview changes:</strong> Watch the preview update in real-time as you rotate pages. Make sure everything looks correct.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-semibold text-yellow-600 min-w-[24px]">4.</span>
                    <p><strong>Download:</strong> Click "Rotate PDF" to save your rotated document. The file will download automatically.</p>
                  </div>
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                      <strong>💡 Tip:</strong> Rotations are cumulative - clicking the same arrow multiple times will continue rotating the page. Left arrow rotates clockwise, right arrow rotates counterclockwise.
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
