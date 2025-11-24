import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

interface EditEntry {
  page: number
  index: number
  original: string
  replacement: string
  x: number
  y: number
  width: number
  height: number
  fontSize: number
  scale: number
}

// NOTE: True in-stream replacement is non-trivial due to encoded fonts & compression.
// This endpoint currently performs a best-effort overlay replacement while
// leaving room for future direct operator substitution.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const editsJson = formData.get('edits') as string | null

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: 'File too large' }, { status: 413 })
    if (!editsJson) return NextResponse.json({ error: 'No edits provided' }, { status: 400 })

    const edits: EditEntry[] = JSON.parse(editsJson)
    if (!Array.isArray(edits) || edits.length === 0) return NextResponse.json({ error: 'Empty edits list' }, { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const pdfDoc = await PDFDocument.load(arrayBuffer)

    // Embed a standard font for replacements
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const pages = pdfDoc.getPages()

    const summary: any[] = []

    for (const edit of edits) {
      const pageIndex = edit.page - 1
      if (pageIndex < 0 || pageIndex >= pages.length) {
        summary.push({ ...edit, mode: 'skipped-out-of-range' })
        continue
      }
      const page = pages[pageIndex]
      const { width: pageWidth, height: pageHeight } = page.getSize()

      // Convert canvas top-left coordinates back to PDF coordinate system
      // Canvas stored top-left y. PDF origin bottom-left.
      const pdfX = edit.x / edit.scale
      const pdfY = pageHeight - ((edit.y + edit.fontSize) / edit.scale)
      const originalWidth = edit.width / edit.scale
      const boxHeight = edit.fontSize / edit.scale

      // Measure replacement width using embedded font metrics
      const replacementWidth = font.widthOfTextAtSize(edit.replacement, edit.fontSize / edit.scale)
      const ratio = replacementWidth / (originalWidth || 1)

      let mode: string
      if (ratio <= 1.02) mode = 'overlay-fit'
      else if (ratio <= 1.15) mode = 'overlay-overflow-minor'
      else mode = 'overlay-overflow-risk'

      // Choose rectangle width to fully cover replacement if longer
      const boxWidth = Math.max(originalWidth, replacementWidth)

      // Draw white rectangle to cover original text (overlay fallback)
      page.drawRectangle({ x: pdfX, y: pdfY, width: boxWidth, height: boxHeight, color: rgb(1,1,1) })

      // Draw replacement text
      page.drawText(edit.replacement, {
        x: pdfX,
        y: pdfY + (boxHeight - edit.fontSize / edit.scale) * 0.15, // small vertical tweak
        size: edit.fontSize / edit.scale,
        font,
        color: rgb(0,0,0)
      })
      summary.push({ page: edit.page, index: edit.index, mode, ratio: Number(ratio.toFixed(3)), originalWidth: Number(originalWidth.toFixed(2)), replacementWidth: Number(replacementWidth.toFixed(2)) })
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="edited-${file.name}"`,
        'X-Edit-Summary': JSON.stringify(summary).slice(0, 8000) // safeguard header size
      }
    })
  } catch (err) {
    console.error('Edit error:', err)
    return NextResponse.json({ error: 'Failed to apply edits' }, { status: 500 })
  }
}
