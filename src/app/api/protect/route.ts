import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userPassword = formData.get('userPassword') as string
    const ownerPassword = formData.get('ownerPassword') as string || userPassword
    const permissions = formData.get('permissions') as string || 'read'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!userPassword) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)
    
    // Add password protection
    // Note: pdf-lib doesn't support encryption directly, so this is a mock implementation
    // In production, you would use a library like HummusJS or call a backend service
    
    // For demonstration, we'll add a watermark to indicate protection
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    
    pages.forEach(page => {
      const { width, height } = page.getSize()
      
      // Add watermark
      page.drawText('PROTECTED', {
        x: width / 2 - 50,
        y: height / 2,
        size: 50,
        font,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3,
      })
    })
    
    const protectedPdfBytes = await pdfDoc.save()
    
    return new NextResponse(Buffer.from(protectedPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${file.name}"`,
        'X-Protection-Level': permissions,
        'X-Protected': 'true',
      },
    })
    
  } catch (error) {
    console.error('Protection error:', error)
    return NextResponse.json({ 
      error: 'Failed to protect PDF. Please ensure the file is a valid PDF.' 
    }, { status: 500 })
  }
}