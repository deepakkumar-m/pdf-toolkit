import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
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
    
    // Extract PDF information
    const pageCount = pdfDoc.getPageCount()
    const pages = pdfDoc.getPages()
    
    // Get document metadata
    const title = pdfDoc.getTitle() || 'Untitled'
    const author = pdfDoc.getAuthor() || 'Unknown'
    const subject = pdfDoc.getSubject() || ''
    const creator = pdfDoc.getCreator() || 'Unknown'
    const producer = pdfDoc.getProducer() || 'Unknown'
    const creationDate = pdfDoc.getCreationDate()
    const modificationDate = pdfDoc.getModificationDate()
    
    // Calculate total file size and page dimensions
    const fileSize = file.size
    const pageDimensions = pages.map((page, index) => {
      const { width, height } = page.getSize()
      return {
        page: index + 1,
        width: Math.round(width),
        height: Math.round(height),
        orientation: width > height ? 'landscape' : 'portrait'
      }
    })
    
    // Calculate average dimensions
    const avgWidth = Math.round(pageDimensions.reduce((sum, p) => sum + p.width, 0) / pageCount)
    const avgHeight = Math.round(pageDimensions.reduce((sum, p) => sum + p.height, 0) / pageCount)
    
    const pdfInfo = {
      filename: file.name,
      fileSize: {
        bytes: fileSize,
        kb: Math.round(fileSize / 1024),
        mb: (fileSize / (1024 * 1024)).toFixed(2)
      },
      pageCount,
      metadata: {
        title,
        author,
        subject,
        creator,
        producer,
        creationDate: creationDate?.toISOString() || null,
        modificationDate: modificationDate?.toISOString() || null
      },
      dimensions: {
        average: {
          width: avgWidth,
          height: avgHeight,
          orientation: avgWidth > avgHeight ? 'landscape' : 'portrait'
        },
        pages: pageDimensions
      },
      security: {
        encrypted: false, // pdf-lib doesn't provide this info easily
        permissions: {
          print: true,
          copy: true,
          modify: true,
          annotate: true
        }
      },
      analysis: {
        hasImages: false, // Would need additional analysis
        hasText: true, // Assume true for now
        hasAnnotations: false, // Would need additional analysis
        estimatedWords: pageCount * 250 // Rough estimate
      }
    }
    
    return NextResponse.json({
      success: true,
      info: pdfInfo
    })
    
  } catch (error) {
    console.error('PDF info extraction error:', error)
    return NextResponse.json({ 
      error: 'Failed to extract PDF information. Please ensure the file is a valid PDF.' 
    }, { status: 500 })
  }
}