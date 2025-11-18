'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, ZoomIn, ZoomOut, FileSearch, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import { Document, Page, pdfjs } from 'react-pdf'

// Use CDN worker to avoid bundler quirks
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

export default function ViewPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState<number>(1)
  const [scale, setScale] = useState<number>(1.0)
  const [fitWidth, setFitWidth] = useState<boolean>(true)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
    setPageNumber(1)
    setNumPages(0)
  }

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const canPrev = pageNumber > 1
  const canNext = pageNumber < (numPages || 1)

  const changePage = (delta: number) => {
    setPageNumber((p) => Math.min(Math.max(1, p + delta), numPages || 1))
  }

  const zoomIn = () => setScale((s) => Math.min(3, parseFloat((s + 0.1).toFixed(2))))
  const zoomOut = () => setScale((s) => Math.max(0.5, parseFloat((s - 0.1).toFixed(2))))
  const resetZoom = () => setScale(1.0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!uploadedFile) return
      if (e.key === 'ArrowRight') changePage(1)
      if (e.key === 'ArrowLeft') changePage(-1)
      if ((e.ctrlKey || e.metaKey) && e.key === '=') zoomIn()
      if ((e.ctrlKey || e.metaKey) && e.key === '-') zoomOut()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === '0') resetZoom()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [uploadedFile, numPages, pageNumber, changePage])

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
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <FileSearch className="w-6 h-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">View PDF</h1>
              <p className="text-gray-600">Fast, clean PDF viewer with pagination and zoom</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-cyan-600" />
                  Upload PDF to View
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFilesUploaded={handleFileUploaded} acceptedFileTypes={[".pdf"]} maxFiles={1} toolType="View PDF" />
              </CardContent>
            </Card>

            {/* Viewer */}
            {uploadedFile && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-gray-600">Page</span>
                      <input
                        type="number"
                        min={1}
                        max={numPages || 1}
                        value={pageNumber}
                        onChange={(e) => setPageNumber(Math.min(Math.max(1, Number(e.target.value) || 1), numPages || 1))}
                        className="w-20 rounded-md border border-gray-300 px-3 py-1 text-sm"
                      />
                      <span className="text-sm text-gray-600">/ {numPages || 1}</span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => changePage(-1)} disabled={!canPrev}>
                          ← Prev
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => changePage(1)} disabled={!canNext}>
                          Next →
                        </Button>
                      </div>

                      <div className="ml-auto flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={zoomOut}><ZoomOut className="w-4 h-4 mr-1" /> Zoom out</Button>
                        <Button variant="outline" size="sm" onClick={resetZoom}><RotateCw className="w-4 h-4 mr-1" /> Reset</Button>
                        <Button variant="outline" size="sm" onClick={zoomIn}><ZoomIn className="w-4 h-4 mr-1" /> Zoom in</Button>
                        <label className="flex items-center gap-2 text-sm text-gray-700 ml-2">
                          <input type="checkbox" checked={fitWidth} onChange={(e) => setFitWidth(e.target.checked)} />
                          Fit to width
                        </label>
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Document file={uploadedFile} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-sm text-gray-500">Loading PDF…</div>}>
                      <div className="flex justify-center">
                        <Page
                          pageNumber={pageNumber}
                          scale={fitWidth ? undefined : scale}
                          width={fitWidth ? 860 : undefined}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                      </div>
                    </Document>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use Left/Right arrow keys to navigate pages.</li>
                  <li>• Cmd/Ctrl + Plus/Minus to zoom, Cmd/Ctrl + 0 to reset.</li>
                  <li>• Toggle &quot;Fit to width&quot; for a comfortable reading size.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
