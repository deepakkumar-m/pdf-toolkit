import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const splitType = formData.get('splitType') as string || 'pages'
    const pageRanges = formData.get('pageRanges') as string || ''
    
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
    const pageCount = pdfDoc.getPageCount()
    
    if (splitType === 'single') {
      // Split into individual pages
      const pdfFiles = []
      
      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create()
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i])
        newPdf.addPage(copiedPage)
        
        const pdfBytes = await newPdf.save()
        pdfFiles.push({
          name: `page-${i + 1}.pdf`,
          data: Array.from(pdfBytes)
        })
      }
      
      return NextResponse.json({
        success: true,
        files: pdfFiles,
        totalPages: pageCount,
        message: `Split into ${pageCount} individual pages`
      })
      
    } else if (splitType === 'range' && pageRanges) {
      // Split by page ranges (e.g., "1-3,5-7,10")
      const ranges = pageRanges.split(',').map(range => {
        const [start, end] = range.trim().split('-').map(num => parseInt(num) - 1)
        return end !== undefined ? [start, end] : [start, start]
      })
      
      const pdfFiles = []
      
      for (let i = 0; i < ranges.length; i++) {
        const [startPage, endPage] = ranges[i]
        
        if (startPage < 0 || endPage >= pageCount) {
          return NextResponse.json({ 
            error: `Invalid page range: ${startPage + 1}-${endPage + 1}. Document has ${pageCount} pages.` 
          }, { status: 400 })
        }
        
        const newPdf = await PDFDocument.create()
        const pageIndices = Array.from(
          { length: endPage - startPage + 1 }, 
          (_, idx) => startPage + idx
        )
        
        const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices)
        copiedPages.forEach(page => newPdf.addPage(page))
        
        const pdfBytes = await newPdf.save()
        pdfFiles.push({
          name: `pages-${startPage + 1}-${endPage + 1}.pdf`,
          data: Array.from(pdfBytes)
        })
      }
      
      return NextResponse.json({
        success: true,
        files: pdfFiles,
        totalPages: pageCount,
        message: `Split into ${pdfFiles.length} documents by page ranges`
      })
      
    } else {
      return NextResponse.json({ 
        error: 'Invalid split type. Use "single" or "range".' 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Split error:', error)
    return NextResponse.json({ 
      error: 'Failed to split PDF. Please ensure the file is a valid PDF.' 
    }, { status: 500 })
  }
}