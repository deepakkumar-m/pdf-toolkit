'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, PenTool, Download, Trash2, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'
import * as pdfjs from 'pdfjs-dist'

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
}

interface SignatureBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  dataUrl: string
  page: number
}

export default function SignPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [showSignaturePad, setShowSignaturePad] = useState(false)
  const [signatures, setSignatures] = useState<SignatureBox[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<{ downloadUrl: string } | null>(null)
  const [scale, setScale] = useState(1.5)
  
  // Canvas refs
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{x:number,y:number}|null>(null)
  const renderTaskRef = useRef<any>(null)
  
  // Dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Load PDF
  const handleFileUploaded = async (files: File[]) => {
    const file = files[0]
    setUploadedFile(file)
    setResult(null)
    setSignatures([])
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      setPdfDoc(pdf)
      setNumPages(pdf.numPages)
      setCurrentPage(1)
      renderPage(pdf, 1)
    } catch (error) {
      console.error('Error loading PDF:', error)
      alert('Failed to load PDF')
    }
  }

  // Render PDF page
  const renderPage = async (pdf: any, pageNum: number) => {
    // Cancel any ongoing render task
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    const canvas = pdfCanvasRef.current
    if (!canvas) return
    
    const context = canvas.getContext('2d')
    if (!context) return
    
    canvas.height = viewport.height
    canvas.width = viewport.width
    
    // Store the render task so we can cancel it if needed
    renderTaskRef.current = page.render({ canvasContext: context, viewport })
    
    try {
      await renderTaskRef.current.promise
      renderTaskRef.current = null
    } catch (error: any) {
      // Ignore cancellation errors
      if (error?.name !== 'RenderingCancelledException') {
        console.error('PDF render error:', error)
      }
    }
  }

  // Change page
  useEffect(() => {
    if (pdfDoc && currentPage) {
      renderPage(pdfDoc, currentPage)
    }
    
    // Cleanup on unmount
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [currentPage, pdfDoc, scale])

  // Signature drawing
  useEffect(() => {
    const canvas = signatureCanvasRef.current
    if (!canvas || !showSignaturePad) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#000'
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const getPos = (e: PointerEvent | React.PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    
    const handleDown = (e: PointerEvent) => {
      drawing.current = true
      const pos = getPos(e)
      lastPoint.current = pos
    }
    
    const handleMove = (e: PointerEvent) => {
      if (!drawing.current || !lastPoint.current) return
      const pos = getPos(e)
      ctx.beginPath()
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
      lastPoint.current = pos
    }
    
    const handleUp = () => {
      drawing.current = false
      lastPoint.current = null
    }
    
    canvas.addEventListener('pointerdown', handleDown)
    canvas.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    
    return () => {
      canvas.removeEventListener('pointerdown', handleDown)
      canvas.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [showSignaturePad])

  const clearSignaturePad = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const saveSignature = () => {
    const canvas = signatureCanvasRef.current
    if (!canvas) return
    
    const dataUrl = canvas.toDataURL('image/png')
    if (dataUrl.length < 1000) {
      alert('Please draw your signature')
      return
    }
    
    // Add signature at center of current view
    const pdfCanvas = pdfCanvasRef.current
    if (!pdfCanvas) return
    
    const newSig: SignatureBox = {
      id: Date.now().toString(),
      x: pdfCanvas.width / 2 - 100,
      y: pdfCanvas.height / 2 - 50,
      width: 200,
      height: 100,
      dataUrl,
      page: currentPage
    }
    
    setSignatures([...signatures, newSig])
    setShowSignaturePad(false)
    clearSignaturePad()
  }

  // Handle signature dragging
  const handleSignatureMouseDown = (e: React.MouseEvent, sig: SignatureBox) => {
    if (sig.page !== currentPage) return
    e.stopPropagation()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setDraggingId(sig.id)
    setDragOffset({
      x: e.clientX - rect.left - sig.x,
      y: e.clientY - rect.top - sig.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingId) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left - dragOffset.x
    const y = e.clientY - rect.top - dragOffset.y
    
    setSignatures(signatures.map(sig => 
      sig.id === draggingId ? { ...sig, x, y } : sig
    ))
  }

  const handleMouseUp = () => {
    setDraggingId(null)
  }

  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id))
  }

  // Process and download
  const handleSign = async () => {
    if (!uploadedFile || signatures.length === 0) {
      alert('Please add at least one signature')
      return
    }
    
    setIsProcessing(true)
    
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('signatures', JSON.stringify(signatures))
      formData.append('scale', scale.toString())
      
      const response = await fetch('/api/sign', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        setResult({ downloadUrl: url })
      } else {
        throw new Error('Signing failed')
      }
    } catch (error) {
      console.error('Error signing PDF:', error)
      alert('Failed to sign PDF')
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadSigned = () => {
    if (!result?.downloadUrl) return
    const a = document.createElement('a')
    a.href = result.downloadUrl
    a.download = `signed-${uploadedFile?.name}`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Home
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/tools" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              Back to Tools
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <PenTool className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sign PDF</h1>
              <p className="text-gray-600">Draw your signature and place it anywhere on the document</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {!uploadedFile ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Card>
                <CardContent className="pt-6">
                  <FileUpload
                    onFilesUploaded={handleFileUploaded}
                    acceptedFileTypes={['.pdf']}
                    maxFiles={1}
                    toolType="PDF Signing"
                  />
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* PDF Viewer */}
              <div className="lg:col-span-3">
                <Card>
                  <CardContent className="p-4">
                    {/* Toolbar */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b">
                      <div className="flex items-center gap-4">
                        <Button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm">
                          Page {currentPage} of {numPages}
                        </span>
                        <Button
                          onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                          disabled={currentPage === numPages}
                          variant="outline"
                          size="sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        onClick={() => setShowSignaturePad(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <PenTool className="w-4 h-4 mr-2" />
                        Create Signature
                      </Button>
                    </div>

                    {/* PDF Canvas Container */}
                    <div
                      ref={containerRef}
                      className="relative border rounded-lg overflow-auto bg-gray-100 max-h-[700px]"
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      <canvas ref={pdfCanvasRef} className="mx-auto" />
                      
                      {/* Signature Overlays */}
                      {signatures.filter(sig => sig.page === currentPage).map((sig) => (
                        <div
                          key={sig.id}
                          className="absolute cursor-move border-2 border-purple-500 rounded group"
                          style={{
                            left: sig.x,
                            top: sig.y,
                            width: sig.width,
                            height: sig.height
                          }}
                          onMouseDown={(e) => handleSignatureMouseDown(e, sig)}
                        >
                          <img src={sig.dataUrl} alt="Signature" className="w-full h-full object-contain" />
                          <button
                            onClick={() => deleteSignature(sig.id)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold mb-3">Signatures</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      {signatures.length} signature(s) added
                    </p>
                    <div className="space-y-2 mb-4">
                      {signatures.map(sig => (
                        <div key={sig.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                          <span>Page {sig.page}</span>
                          <Button
                            onClick={() => deleteSignature(sig.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    {!result ? (
                      <Button
                        onClick={handleSign}
                        disabled={isProcessing || signatures.length === 0}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {isProcessing ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Signing...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Sign PDF
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-green-600 text-sm font-medium flex items-center gap-2 mb-2">
                          <Check className="w-4 h-4" />
                          PDF Signed Successfully!
                        </div>
                        <Button
                          onClick={downloadSigned}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Signed PDF
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Signature Pad Modal */}
          {showSignaturePad && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg p-6 max-w-2xl w-full"
              >
                <h3 className="text-lg font-bold mb-4">Draw Your Signature</h3>
                <div className="border-2 border-gray-300 rounded-lg mb-4 bg-gray-50">
                  <canvas
                    ref={signatureCanvasRef}
                    width={700}
                    height={300}
                    className="w-full touch-none"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={clearSignaturePad} variant="outline" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button onClick={() => setShowSignaturePad(false)} variant="outline" className="flex-1">
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button onClick={saveSignature} className="flex-1 bg-purple-600 hover:bg-purple-700">
                    <Check className="w-4 h-4 mr-2" />
                    Add to PDF
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
