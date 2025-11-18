'use client'

import { useEffect, useState } from 'react'
import { Upload, FileText, Download, Loader2, Eye, Copy, Check } from 'lucide-react'
import Tesseract from 'tesseract.js'
import * as pdfjsLib from 'pdfjs-dist'

export default function OCRPDFPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [ocrResult, setOCRResult] = useState<any>(null)
  const [error, setError] = useState<string>('')
  const [language, setLanguage] = useState('eng')
  const [copied, setCopied] = useState(false)
  const [progress, setProgress] = useState<number>(0)

  useEffect(() => {
    try {
      // Use locally hosted legacy worker to avoid cross-origin/module issues
      // The file is copied to /public/pdfjs/pdf.worker.min.js via postinstall
      // @ts-ignore - pdfjs types may not include GlobalWorkerOptions
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
    } catch (_) {
      // no-op
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Check if file is PDF or image
      const validTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/tiff',
        'image/bmp'
      ]
      
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (JPEG, PNG, TIFF, BMP)')
        return
      }
      
      if (selectedFile.size > 200 * 1024 * 1024) {
        setError('File size must be less than 200MB')
        return
      }
      
      setFile(selectedFile)
      setError('')
      setOCRResult(null)
    }
  }

  const handleOCR = async () => {
    if (!file) {
      setError('Please select a file first')
      return
    }

    setIsProcessing(true)
    setError('')
    setOCRResult(null)
    setProgress(0)

    const startedAt = performance.now()

    try {
      if (file.type.startsWith('image/')) {
        const { data } = await Tesseract.recognize(file, language, {
          logger: (m) => {
            if (m.status === 'recognizing text' && m.progress != null) {
              setProgress(Math.round(m.progress * 100))
            }
          },
        })

        const endedAt = performance.now()
        setOCRResult({
          success: true,
          fullText: data.text,
          confidence: data.confidence / 100,
          metadata: {
            language,
            fileType: file.type,
            processingTime: `${((endedAt - startedAt) / 1000).toFixed(1)}s`,
            confidence: data.confidence / 100,
          },
          fileType: 'image',
        })
      } else if (file.type === 'application/pdf') {
        // Render each page to an image and run OCR per page
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        const pageCount = pdf.numPages

        let combinedText = ''
        const pages: Array<{ pageNumber: number; text: string; confidence: number }> = []
        let confidenceSum = 0

        for (let i = 1; i <= pageCount; i++) {
          // Update coarse progress per page
          setProgress(Math.round(((i - 1) / pageCount) * 100))

          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 2 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')!
          canvas.width = viewport.width
          canvas.height = viewport.height
          await page.render({ canvasContext: context, viewport }).promise
          const dataUrl = canvas.toDataURL('image/png')

          const { data } = await Tesseract.recognize(dataUrl, language, {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress != null) {
                const pageBase = ((i - 1) / pageCount) * 100
                const withinPage = m.progress * (1 / pageCount) * 100
                setProgress(Math.min(100, Math.round(pageBase + withinPage)))
              }
            },
          })

          const pageText = data.text || ''
          const pageConfidence = (data.confidence || 0) / 100
          combinedText += (i > 1 ? '\n\n' : '') + pageText
          confidenceSum += pageConfidence
          pages.push({ pageNumber: i, text: pageText, confidence: pageConfidence })
        }

        const endedAt = performance.now()
        const avgConfidence = pageCount ? confidenceSum / pageCount : 0
        setProgress(100)
        setOCRResult({
          success: true,
          fullText: combinedText,
          pages,
          metadata: {
            language,
            totalPages: pageCount,
            processingTime: `${((endedAt - startedAt) / 1000).toFixed(1)}s`,
            confidence: avgConfidence,
          },
          fileType: 'pdf',
        })
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run OCR')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownloadText = () => {
    if (!ocrResult?.fullText) return

    const blob = new Blob([ocrResult.fullText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ocr-result-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopyText = async () => {
    if (!ocrResult?.fullText) return
    
    try {
      await navigator.clipboard.writeText(ocrResult.fullText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-blue-100 rounded-full">
                <FileText className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              PDF & Image OCR
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Extract text from PDFs and images using Optical Character Recognition
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            {/* Language Selection */}
            <div className="mb-6">
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                OCR Language
              </label>
              <select
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="eng">English</option>
                <option value="fra">French</option>
                <option value="deu">German</option>
                <option value="spa">Spanish</option>
                <option value="ita">Italian</option>
                <option value="por">Portuguese</option>
                <option value="rus">Russian</option>
                <option value="chi_sim">Chinese (Simplified)</option>
                <option value="jpn">Japanese</option>
                <option value="kor">Korean</option>
              </select>
            </div>

            {/* File Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File (PDF or Image)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,image/*"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF or Images (JPEG, PNG, TIFF, BMP) up to 200MB
                  </p>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            {/* OCR Button */}
            <button
              onClick={handleOCR}
              disabled={!file || isProcessing}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing OCR... {progress}%
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Extract Text
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          {ocrResult && (
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Extracted Text
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyText}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleDownloadText}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              </div>

              {/* Metadata */}
              {ocrResult.metadata && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">OCR Details:</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {ocrResult.metadata.totalPages && (
                      <div>
                        <span className="text-gray-600">Total Pages:</span>
                        <span className="ml-2 font-medium">{ocrResult.metadata.totalPages}</span>
                      </div>
                    )}
                    {ocrResult.metadata.language && (
                      <div>
                        <span className="text-gray-600">Language:</span>
                        <span className="ml-2 font-medium">{ocrResult.metadata.language}</span>
                      </div>
                    )}
                    {ocrResult.metadata.confidence && (
                      <div>
                        <span className="text-gray-600">Confidence:</span>
                        <span className="ml-2 font-medium">{(ocrResult.metadata.confidence * 100).toFixed(1)}%</span>
                      </div>
                    )}
                    {ocrResult.metadata.processingTime && (
                      <div>
                        <span className="text-gray-600">Processing Time:</span>
                        <span className="ml-2 font-medium">{ocrResult.metadata.processingTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Full Text */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Full Text:</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {ocrResult.fullText}
                  </pre>
                </div>
              </div>

              {/* Page-by-Page Results (for PDFs) */}
              {ocrResult.pages && ocrResult.pages.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Page-by-Page Results:
                  </h3>
                  <div className="space-y-4">
                    {ocrResult.pages.map((page: any) => (
                      <details
                        key={page.pageNumber}
                        className="bg-gray-50 rounded-lg p-4"
                      >
                        <summary className="cursor-pointer font-medium text-gray-900 flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Page {page.pageNumber}
                          {page.confidence && (
                            <span className="text-sm text-gray-600 ml-2">
                              (Confidence: {(page.confidence * 100).toFixed(1)}%)
                            </span>
                          )}
                        </summary>
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                            {page.text}
                          </pre>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-2">About This Tool</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Extract text from scanned PDFs and images</li>
              <li>• Supports multiple languages</li>
              <li>• Maximum file size: 200MB</li>
              <li>• Supported formats: PDF, JPEG, PNG, TIFF, BMP</li>
              <li>• Runs fully in your browser using Tesseract.js</li>
              <li>• For very large PDFs, processing can be slow on-device</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
