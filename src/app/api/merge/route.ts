import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('files') as File[]
    
    if (files.length < 2) {
      return NextResponse.json({ 
        error: 'At least 2 files are required for merging' 
      }, { status: 400 })
    }

    // Validate sizes
    for (const file of files) {
      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json({ error: 'Each file must be <= 200 MB.' }, { status: 413 })
      }
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create()

    // Process each file and merge
    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
      copiedPages.forEach((page) => mergedPdf.addPage(page))
    }

    // Serialize the PDF
    const pdfBytes = await mergedPdf.save()
    
    // Create response with the merged PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="merged-document.pdf"',
      },
    })
    
  } catch (error) {
    console.error('Merge error:', error)
    return NextResponse.json({ 
      error: 'Failed to merge PDFs' 
    }, { status: 500 })
  }
}