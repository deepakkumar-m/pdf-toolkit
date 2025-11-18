import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, degrees } from 'pdf-lib'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

type Selection = 'all' | 'even' | 'odd' | 'ranges'

function parseRanges(ranges: string, totalPages: number): Set<number> {
  const set = new Set<number>()
  if (!ranges) return set
  const parts = ranges.split(',')
  for (const part of parts) {
    const p = part.trim()
    if (!p) continue
    if (p.includes('-')) {
      const [startStr, endStr] = p.split('-')
      let start = parseInt(startStr, 10)
      let end = parseInt(endStr, 10)
      if (Number.isNaN(start) || Number.isNaN(end)) continue
      if (start > end) [start, end] = [end, start]
      for (let i = Math.max(1, start); i <= Math.min(totalPages, end); i++) set.add(i - 1)
    } else {
      const n = parseInt(p, 10)
      if (!Number.isNaN(n) && n >= 1 && n <= totalPages) set.add(n - 1)
    }
  }
  return set
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const pageRotationsStr = (formData.get('pageRotations') as string) || '{}'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    const pageRotations: Record<number, number> = JSON.parse(pageRotationsStr)

    const pdfBytes = new Uint8Array(await file.arrayBuffer())
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const total = pages.length

    let count = 0
    for (let i = 0; i < total; i++) {
      const rotateBy = pageRotations[i] || 0
      if (rotateBy === 0) continue
      
      const page = pages[i]
      const current = page.getRotation()?.angle || 0
      const newAngle = ((current + rotateBy) % 360 + 360) % 360
      page.setRotation(degrees(newAngle))
      count++
    }

    const out = await pdfDoc.save()
    return new NextResponse(Buffer.from(out), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rotated-${file.name}"`,
        'X-Rotation-Count': String(count),
      },
    })
  } catch (error) {
    console.error('Rotate error:', error)
    return NextResponse.json({ error: 'Failed to rotate PDF. Ensure the file is valid.' }, { status: 500 })
  }
}
