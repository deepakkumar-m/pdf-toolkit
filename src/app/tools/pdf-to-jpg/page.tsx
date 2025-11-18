"use client"

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Image as ImageIcon, ArrowLeft, Download, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

interface ConvertedImage {
  page: number
  name: string
  url: string
}

type Quality = 'low' | 'medium' | 'high'

export default function PdfToJpgPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [quality, setQuality] = useState<Quality>('high')
  const [dpi, setDpi] = useState<number | ''>('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [images, setImages] = useState<ConvertedImage[]>([])

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setImages([])
  }

  const handleConvert = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setImages([])

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('format', 'jpg')
      formData.append('quality', quality)
      if (dpi !== '') formData.append('dpi', String(dpi))

      const res = await fetch('/api/pdf-to-image', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to convert PDF to images')
      }

      const data = await res.json()
      const format: 'jpg' | 'png' = data.format === 'png' ? 'png' : 'jpg'
      const mime = format === 'png' ? 'image/png' : 'image/jpeg'

      const imgs: ConvertedImage[] = (data.images || []).map((img: any) => {
        const bytes = new Uint8Array(img.data)
        const blob = new Blob([bytes], { type: mime })
        const url = URL.createObjectURL(blob)
        return { page: img.page, name: img.name, url }
      })

      setImages(imgs)
    } catch (err: any) {
      console.error('Convert error:', err)
      alert(err?.message || 'Failed to convert PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadAll = () => {
    images.forEach((img) => {
      const a = document.createElement('a')
      a.href = img.url
      a.download = img.name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
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
            <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">PDF to JPG</h1>
              <p className="text-gray-600">Convert your PDF pages into high-quality JPG images</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {/* Upload */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-pink-600" />
                  Upload PDF to Convert
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="PDF to JPG"
                />
              </CardContent>
            </Card>

            {/* Options */}
            {uploadedFile && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Conversion Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quality</label>
                      <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value as Quality)}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-600"
                      >
                        <option value="low">Low (72 DPI)</option>
                        <option value="medium">Medium (150 DPI)</option>
                        <option value="high">High (300 DPI)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Custom DPI (optional)</label>
                      <input
                        type="number"
                        min={50}
                        max={600}
                        placeholder="e.g., 200"
                        value={dpi}
                        onChange={(e) => {
                          const v = e.target.value
                          setDpi(v === '' ? '' : Number(v))
                        }}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-600"
                      />
                      <p className="text-xs text-gray-500 mt-2">Overrides Quality if set. Range 50–600.</p>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleConvert} disabled={isProcessing} size="lg" className="w-full">
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Converting...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Convert to JPG
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <AlertCircle className="w-5 h-5" />
                    {images.length} image(s) ready to download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {images.map((img) => (
                      <div key={img.page} className="rounded-md border p-3 bg-white flex flex-col">
                        <div className="flex-1 overflow-hidden rounded-md bg-gray-50 border mb-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.url} alt={img.name} className="w-full object-contain max-h-64" />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate pr-2">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{img.name}</p>
                          </div>
                          <Button onClick={() => {
                            const a = document.createElement('a')
                            a.href = img.url
                            a.download = img.name
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                          }} size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Button variant="secondary" onClick={downloadAll}>
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                    <Button variant="ghost" onClick={() => setImages([])}>Clear</Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
