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

// Utility: escape parentheses in PDF literal strings
function escapePdfLiteral(str: string) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

// Replace the nth occurrence of (text) Tj or within TJ arrays.
function replaceNthLiteral(content: string, original: string, replacement: string, targetIndex: number) {
  // Very naive lexer for ( ... ) tokens followed by Tj or inside [ ... ] TJ arrays.
  // Only handles ASCII, no binary, no octal escapes beyond simple parens & backslashes.
  let occurrence = 0
  const origEscaped = original.replace(/([.*+?^${}()|\[\]\\])/g, '\\$1')
  // Regex for (original) Tj
  const tjRegex = new RegExp(`\(${origEscaped}\)\s*Tj`, 'g')
  // Regex for (original) inside TJ array: [ ... (original) ... ] TJ
  const tjArrayRegex = new RegExp(`\(${origEscaped}\)`, 'g')

  let mutated = content
  let replaced = false
  let mode: 'direct' | null = null

  // Pass 1: direct Tj operators
  mutated = mutated.replace(tjRegex, (match) => {
    if (occurrence === targetIndex) {
      replaced = true
      mode = 'direct'
      const rep = `(${escapePdfLiteral(replacement)}) Tj`
      return rep
    }
    occurrence++
    return match
  })

  if (!replaced) {
    // Pass 2: TJ arrays; need to ensure we are within an array preceding TJ
    // This is simplistic: after full replacement attempt, we scan arrays.
    // We rebuild arrays by counting occurrences again.
    occurrence = 0
    const arraySegments: string[] = []
    let lastIndex = 0
    // Split keeping delimiters may get complex; fallback to global replace
    mutated = mutated.replace(tjArrayRegex, (match, offset) => {
      // Determine if this match is inside an array preceding TJ by looking ahead a bit
      const tail = mutated.slice(offset, offset + 500)
      if (!/\] \s*TJ/.test(tail)) return match // not part of a TJ array close soon
      if (occurrence === targetIndex) {
        replaced = true
        mode = 'direct'
        return `(${escapePdfLiteral(replacement)})`
      }
      occurrence++
      return match
    })
  }
  return { content: mutated, replaced, mode }
}

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
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true })
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
      let directAttempted = false
      let directSuccess = false

      try {
        const streams = page.getContentStreams()
        // Combine streams temporarily for naive replacement; advanced version would map indices.
        // We will mutate first stream containing target occurrence.
        let cumulative = 0
        for (let sIdx = 0; sIdx < streams.length; sIdx++) {
          const s = streams[sIdx]
            // @ts-ignore internal decode
          const decoded = s.decode() as Uint8Array
          let contentStr = Buffer.from(decoded).toString('latin1')
          const targetIndex = edit.index // naive assumption global ordering
          const { content: newContent, replaced } = replaceNthLiteral(contentStr, edit.original, edit.replacement, targetIndex)
          if (replaced) {
            directAttempted = true
            directSuccess = true
            // Replace stream with new flate-compressed content
            const newStream = pdfDoc.context.flateStream(Buffer.from(newContent, 'latin1'))
            // If single stream just set; if multiple we need to build array
            if (streams.length === 1) {
              // @ts-ignore internal node access
              page.node.set(page.doc.context.lookup('Contents'), newStream) // fallback if direct method fails
            } else {
              // Rebuild array of streams with replaced one
              const updated = streams.map((orig, i) => i === sIdx ? newStream : orig)
              // @ts-ignore internal node access
              page.node.set(page.doc.context.lookup('Contents'), pdfDoc.context.obj(updated))
            }
            break
          }
        }
      } catch (e) {
        // swallow; will fallback
      }

      if (directSuccess) {
        summary.push({ page: edit.page, index: edit.index, mode: 'direct' })
        continue
      }

      // Fallback overlay
      const { height: pageHeight } = pages[pageIndex].getSize()
      const pdfX = edit.x / edit.scale
      const pdfY = pageHeight - ((edit.y + edit.fontSize) / edit.scale)
      const originalWidth = edit.width / edit.scale
      const replacementWidth = font.widthOfTextAtSize(edit.replacement, edit.fontSize / edit.scale)
      const boxWidth = Math.max(originalWidth, replacementWidth)
      const boxHeight = edit.fontSize / edit.scale
      pages[pageIndex].drawRectangle({ x: pdfX, y: pdfY, width: boxWidth, height: boxHeight, color: rgb(1,1,1) })
      pages[pageIndex].drawText(edit.replacement, {
        x: pdfX,
        y: pdfY + (boxHeight - edit.fontSize / edit.scale) * 0.15,
        size: edit.fontSize / edit.scale,
        font,
        color: rgb(0,0,0)
      })
      summary.push({ page: edit.page, index: edit.index, mode: directAttempted? 'overlay-fallback' : 'overlay' })
    }

    const pdfBytes = await pdfDoc.save()
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="edited-direct-${file.name}"`,
        'X-Edit-Summary': JSON.stringify(summary).slice(0, 8000)
      }
    })
  } catch (err) {
    console.error('Direct edit error:', err)
    return NextResponse.json({ error: 'Failed to apply direct edits' }, { status: 500 })
  }
}
