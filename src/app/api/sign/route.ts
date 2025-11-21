import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import crypto from 'crypto'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

interface SignatureBox {
  id: string
  x: number
  y: number
  width: number
  height: number
  dataUrl: string
  page: number
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const signaturesJson = formData.get('signatures') as string
    const scale = parseFloat((formData.get('scale') as string) || '1.5')

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!signaturesJson) {
      return NextResponse.json({ error: 'No signatures provided' }, { status: 400 })
    }

    const signatures: SignatureBox[] = JSON.parse(signaturesJson)

    if (signatures.length === 0) {
      return NextResponse.json({ error: 'At least one signature is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    // Load the PDF
    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    const pages = pdfDoc.getPages()

    // Process each signature
    for (const sig of signatures) {
      const pageIndex = sig.page - 1
      if (pageIndex < 0 || pageIndex >= pages.length) continue

      const page = pages[pageIndex]
      const { width: pageWidth, height: pageHeight } = page.getSize()

      // Convert canvas coordinates to PDF coordinates
      // Canvas Y is top-down, PDF Y is bottom-up
      const pdfX = sig.x / scale
      const pdfY = pageHeight - (sig.y / scale) - (sig.height / scale)
      const pdfWidth = sig.width / scale
      const pdfHeight = sig.height / scale

      // Embed signature image
      const base64 = sig.dataUrl.split(',')[1]
      const imgBytes = Buffer.from(base64, 'base64')
      let image
      try {
        image = await pdfDoc.embedPng(imgBytes)
      } catch {
        image = await pdfDoc.embedJpg(imgBytes)
      }

      // Draw signature on the page
      page.drawImage(image, {
        x: pdfX,
        y: pdfY,
        width: pdfWidth,
        height: pdfHeight,
        opacity: 1.0
      })
    }
    
    // Save the modified PDF
    const pdfBytes = await pdfDoc.save()
    
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="signed-${file.name}"`,
        'X-Page-Count': pages.length.toString(),
        'X-Signature-Count': signatures.length.toString(),
      },
    })
  } catch (error) {
    console.error('Signing error:', error)
    return NextResponse.json(
      { error: 'Failed to sign PDF. Please ensure the file is a valid PDF.' },
      { status: 500 }
    )
  }
}
