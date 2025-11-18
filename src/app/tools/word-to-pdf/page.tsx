'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Download, ArrowLeft, FileText, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

export default function WordToPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultMsg, setResultMsg] = useState<string | null>(null)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setResultMsg(null)
  }

  const handleConvert = async () => {
    if (!uploadedFile) return

    setIsProcessing(true)
    setResultMsg(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('convertTo', 'pdf')

      const res = await fetch('/api/convert', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to convert to PDF')
      }

      const contentType = res.headers.get('Content-Type') || ''
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const filename = res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || (uploadedFile.name.replace(/\.(docx?|rtf|txt)$/i, '.pdf'))
        const isDemoMode = res.headers.get('X-Demo-Mode') === 'true'

        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        if (isDemoMode) {
          setResultMsg(`⚠️ Demo Mode: Downloaded placeholder PDF. Install LibreOffice for real conversion: brew install --cask libreoffice`)
        } else {
          setResultMsg(`✅ Conversion complete. Downloaded ${filename}`)
        }
      } else {
        const data = await res.json()
        if (data?.success) {
          setResultMsg('Converted successfully.')
        } else {
          throw new Error(data?.error || 'Unexpected response from server')
        }
      }
    } catch (err: any) {
      console.error('Word→PDF error:', err)
      alert(err?.message || 'Failed to convert to PDF. Please try again.')
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
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Download className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Word to PDF</h1>
              <p className="text-gray-600">Convert .docx, .doc, .rtf, or .txt to PDF</p>
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
                  <FileText className="w-5 h-5 text-emerald-600" />
                  Upload Document
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={[".doc", ".docx", ".rtf", ".txt"]}
                  maxFiles={1}
                  toolType="Word to PDF"
                />

                {uploadedFile && (
                  <div className="mt-6 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-700 mb-2">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Ready to Convert</span>
                    </div>
                    <p className="text-emerald-700 text-sm mb-4">
                      {uploadedFile.name} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>

                    <Button onClick={handleConvert} disabled={isProcessing} size="lg" className="w-full sm:w-auto">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Converting...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Convert to PDF
                        </>
                      )}
                    </Button>

                    {resultMsg && (
                      <p className="text-sm text-emerald-700 mt-3">{resultMsg}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
