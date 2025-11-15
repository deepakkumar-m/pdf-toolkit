import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const convertTo = formData.get('convertTo') as string || 'pdf'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    const buffer = await file.arrayBuffer()
    
    // Handle different conversion types
    switch (convertTo) {
      case 'word':
        return NextResponse.json({ 
          error: 'PDF to Word conversion feature has been removed.' 
        }, { status: 410 })
        
      case 'pdf':
        if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
          // Word to PDF conversion
          const pdfDoc = await PDFDocument.create()
          const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
          
          // Add content indicating this is a converted document
          page.drawText('Converted from Word Document', {
            x: 50,
            y: 750,
            size: 20,
            font,
            color: rgb(0, 0, 0),
          })
          
          page.drawText(`Original filename: ${file.name}`, {
            x: 50,
            y: 700,
            size: 12,
            font,
            color: rgb(0.5, 0.5, 0.5),
          })
          
          page.drawText('This is a demo conversion showing how Word to PDF conversion would work.', {
            x: 50,
            y: 650,
            size: 12,
            font,
            color: rgb(0.3, 0.3, 0.3),
          })
          
          const pdfBytes = await pdfDoc.save()
          
          return new NextResponse(Buffer.from(pdfBytes), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${file.name.replace(/\.(docx?|rtf|txt)$/i, '.pdf')}"`,
            },
          })
        } else if (file.type === 'application/pdf') {
          return NextResponse.json({ 
            error: 'File is already in PDF format' 
          }, { status: 400 })
        }
        break
        
      case 'jpg':
      case 'png':
        if (file.type === 'application/pdf') {
          // PDF to Image conversion (mock)
          return NextResponse.json({ 
            success: true,
            message: `PDF successfully converted to ${convertTo.toUpperCase()} images`,
            convertTo,
            originalName: file.name,
            images: [
              { page: 1, filename: `page-1.${convertTo}`, size: '1024x768' },
              { page: 2, filename: `page-2.${convertTo}`, size: '1024x768' }
            ],
            totalPages: 2,
            note: 'This is a demo conversion. In production, pdf2pic or similar libraries would generate actual images.'
          })
        }
        break
        
      case 'txt':
        // Extract text content (mock)
        return NextResponse.json({ 
          success: true,
          message: 'Text successfully extracted from document',
          convertTo: 'txt',
          originalName: file.name,
          extractedText: `This is extracted text from ${file.name}.\n\nIn a real implementation, this would contain the actual text content extracted from the document using OCR or text parsing libraries.\n\nOriginal file size: ${file.size} bytes\nFile type: ${file.type}`,
          wordCount: 42,
          characterCount: 234
        })
        
      default:
        return NextResponse.json({ 
          error: `Conversion to ${convertTo} is not supported yet` 
        }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Unsupported file type for this conversion' 
    }, { status: 400 })
    
  } catch (error) {
    console.error('Conversion error:', error)
    return NextResponse.json({ 
      error: 'Conversion failed. Please ensure the file is valid.' 
    }, { status: 500 })
  }
}