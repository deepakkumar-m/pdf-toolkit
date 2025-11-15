import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const compressionLevel = formData.get('compressionLevel') as string || 'medium'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Apply compression based on level
    let compressedPdfBytes: Uint8Array
    
    switch (compressionLevel) {
      case 'low':
        // Light compression - preserve most quality
        compressedPdfBytes = await pdfDoc.save({
          useObjectStreams: false
        })
        break
      case 'high':
        // High compression - more size reduction
        compressedPdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          objectsPerTick: 50
        })
        break
      default: // medium
        // Balanced compression
        compressedPdfBytes = await pdfDoc.save({
          useObjectStreams: true
        })
        break
    }
    
    const originalSize = file.size
    const compressedSize = compressedPdfBytes.length
    const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1)
    
    return new NextResponse(Buffer.from(compressedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${file.name}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio.toString(),
      },
    })
    
  } catch (error) {
    console.error('Compression error:', error)
    return NextResponse.json({ 
      error: 'Failed to compress PDF. Please ensure the file is a valid PDF.' 
    }, { status: 500 })
  }
}