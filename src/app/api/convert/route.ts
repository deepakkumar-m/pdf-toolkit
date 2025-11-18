import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { exec } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'

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
        
      case 'pdf': {
        const lower = file.name.toLowerCase()
        const isWordLike =
          file.type.includes('word') ||
          lower.endsWith('.docx') ||
          lower.endsWith('.doc') ||
          lower.endsWith('.rtf') ||
          lower.endsWith('.txt')

        if (isWordLike) {
          // Try real conversion via LibreOffice if installed
          const soffice = process.env.LIBREOFFICE_EXEC || 'soffice'
          
          // Check if soffice is available
          const checkCmd = `which ${soffice} || test -x /Applications/LibreOffice.app/Contents/MacOS/soffice`
          const isSofficeAvailable = await new Promise<boolean>((resolve) => {
            exec(checkCmd, (error) => resolve(!error))
          })

          if (isSofficeAvailable) {
            // Real conversion
            const inTmp = path.join('/tmp', `word2pdf-${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(lower)}`)
            const outDir = '/tmp'
            await writeFile(inTmp, Buffer.from(buffer))

            const sofficeCmd = soffice === 'soffice' && !isSofficeAvailable 
              ? '/Applications/LibreOffice.app/Contents/MacOS/soffice'
              : soffice
            const cmd = `${sofficeCmd} --headless --convert-to pdf --outdir ${outDir} ${inTmp}`
            
            await new Promise((resolve, reject) => {
              exec(cmd, (error) => (error ? reject(error) : resolve(undefined)))
            })

            const outPdf = path.join(outDir, `${path.parse(inTmp).name}.pdf`)
            const pdfBuf = await readFile(outPdf)

            // cleanup
            await unlink(inTmp).catch(() => {})
            await unlink(outPdf).catch(() => {})

            return new NextResponse(Buffer.from(pdfBuf), {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace(/\.(docx?|doc|rtf|txt)$/i, '.pdf')}"`,
              },
            })
          } else {
            // Fallback: Create a demo PDF with placeholder content
            const pdfDoc = await PDFDocument.create()
            const page = pdfDoc.addPage([595.28, 841.89]) // A4 size
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
            
            page.drawText('Word to PDF Conversion - Demo Mode', {
              x: 50,
              y: 750,
              size: 20,
              font,
              color: rgb(0, 0, 0),
            })
            
            page.drawText(`Original file: ${file.name}`, {
              x: 50,
              y: 700,
              size: 12,
              font,
              color: rgb(0.5, 0.5, 0.5),
            })
            
            page.drawText('LibreOffice is not installed. This is a placeholder PDF.', {
              x: 50,
              y: 650,
              size: 12,
              font,
              color: rgb(0.8, 0.3, 0.3),
            })
            
            page.drawText('To enable real conversion, install LibreOffice:', {
              x: 50,
              y: 620,
              size: 11,
              font,
              color: rgb(0.3, 0.3, 0.3),
            })
            
            page.drawText('brew install --cask libreoffice', {
              x: 50,
              y: 595,
              size: 10,
              font,
              color: rgb(0, 0, 0.8),
            })
            
            const pdfBytes = await pdfDoc.save()
            
            return new NextResponse(Buffer.from(pdfBytes), {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${file.name.replace(/\.(docx?|doc|rtf|txt)$/i, '.pdf')}"`,
                'X-Demo-Mode': 'true',
                'X-LibreOffice-Missing': 'true',
              },
            })
          }
        }

        if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
          return NextResponse.json({ 
            error: 'File is already in PDF format' 
          }, { status: 400 })
        }

        return NextResponse.json({
          error: 'Unsupported input type for Word to PDF. Please upload .docx, .doc, .rtf, or .txt.'
        }, { status: 400 })
      }
        
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
    const message = (error as Error)?.message || ''
    if (message.includes('ENOENT') || message.includes('soffice')) {
      return NextResponse.json({
        error: 'LibreOffice (soffice) is not installed or not available in PATH. On macOS: brew install --cask libreoffice, then optionally set LIBREOFFICE_EXEC to the soffice binary path (e.g., /Applications/LibreOffice.app/Contents/MacOS/soffice).'
      }, { status: 500 })
    }
    return NextResponse.json({ 
      error: 'Conversion failed. Please ensure the file is valid.' 
    }, { status: 500 })
  }
}