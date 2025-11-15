'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Scissors, ArrowLeft, Download, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

type SplitType = 'single' | 'range'

interface SplitResultFile {
  name: string
  url: string
}

export default function SplitPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [splitType, setSplitType] = useState<SplitType>('single')
  const [pageRanges, setPageRanges] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [results, setResults] = useState<SplitResultFile[]>([])

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setResults([])
  }

  const handleSplit = async () => {
    if (!uploadedFile) return
    if (splitType === 'range' && !pageRanges.trim()) {
      alert('Please enter page ranges, e.g., 1-3,5,7-8')
      return
    }

    setIsProcessing(true)
    setResults([])

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('splitType', splitType)
      if (splitType === 'range') formData.append('pageRanges', pageRanges.trim())

      const res = await fetch('/api/split', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to split PDF')
      }

      const data = await res.json()
      const files: SplitResultFile[] = (data.files || []).map((f: any) => {
        const bytes = new Uint8Array(f.data)
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        return { name: f.name, url }
      })
      setResults(files)
    } catch (err: any) {
      console.error('Split error:', err)
      alert(err?.message || 'Failed to split PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadAll = async () => {
    // Download each file individually. For zipping, we could add JSZip later.
    results.forEach((f) => {
      const a = document.createElement('a')
      a.href = f.url
      a.download = f.name
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
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <Scissors className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Split PDF</h1>
              <p className="text-gray-600">Extract pages or split a PDF into multiple documents</p>
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
                  <Scissors className="w-5 h-5 text-teal-600" />
                  Upload PDF to Split
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload
                  onFilesUploaded={handleFileUploaded}
                  acceptedFileTypes={['.pdf']}
                  maxFiles={1}
                  toolType="Split PDF"
                />
              </CardContent>
            </Card>

            {/* Options */}
            {uploadedFile && (
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-blue-600" />
                    Split Options
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Split Type</label>
                      <div className="space-y-3">
                        {[
                          { value: 'single', label: 'Each page as separate PDF', desc: 'Creates one PDF per page' },
                          { value: 'range', label: 'By page ranges', desc: 'Specify ranges like 1-3,5,7-8' }
                        ].map((opt) => (
                          <div key={opt.value} className="flex items-center">
                            <input
                              type="radio"
                              id={opt.value}
                              name="splitType"
                              value={opt.value}
                              checked={splitType === (opt.value as SplitType)}
                              onChange={(e) => setSplitType(e.target.value as SplitType)}
                              className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-600"
                            />
                            <label htmlFor={opt.value} className="ml-3 block">
                              <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                              <div className="text-sm text-gray-500">{opt.desc}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {splitType === 'range' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Page Ranges</label>
                        <input
                          type="text"
                          value={pageRanges}
                          onChange={(e) => setPageRanges(e.target.value)}
                          placeholder="e.g., 1-3,5,7-8"
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                        <p className="text-xs text-gray-500 mt-2">Use commas to separate ranges or single pages.</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6">
                    <Button onClick={handleSplit} disabled={isProcessing} size="lg" className="w-full sm:w-auto">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Splitting...
                        </>
                      ) : (
                        <>
                          <Scissors className="w-4 h-4 mr-2" />
                          Split PDF
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <AlertCircle className="w-5 h-5" />
                    {results.length} file(s) ready to download
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {results.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between rounded-md border px-4 py-3 bg-white">
                        <div className="truncate pr-4">
                          <p className="font-medium text-gray-900 truncate max-w-md">{f.name}</p>
                        </div>
                        <Button onClick={() => {
                          const a = document.createElement('a')
                          a.href = f.url
                          a.download = f.name
                          document.body.appendChild(a)
                          a.click()
                          document.body.removeChild(a)
                        }} size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center gap-3">
                    <Button variant="secondary" onClick={downloadAll}>
                      <Download className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                    <Button variant="ghost" onClick={() => setResults([])}>Clear</Button>
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
