import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile, readFile, unlink } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const compressionLevel = (formData.get('compressionLevel') as string) || 'medium'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    // Save uploaded file to /tmp
    const arrayBuffer = await file.arrayBuffer()
    const originalBuffer = Buffer.from(arrayBuffer)
    const inputPath = path.join('/tmp', `input-${Date.now()}.pdf`)
    const outputPath = path.join('/tmp', `output-${Date.now()}.pdf`)
    await writeFile(inputPath, originalBuffer)

    // Target minimum reduction percentages
    const targets: Record<string, number> = { low: 15, medium: 40, high: 65 }

    // Base (pass 1) settings per level (balanced for quality)
    let gsLevel: string
    let colorDpi: number
    let grayDpi: number
    let monoDpi: number
    if (compressionLevel === 'low') {
      gsLevel = '/printer'
      colorDpi = 300
      grayDpi = 300
      monoDpi = 1200
    } else if (compressionLevel === 'medium') {
      gsLevel = '/ebook'
      colorDpi = 150
      grayDpi = 150
      monoDpi = 300
    } else { // high
      gsLevel = '/screen'
      colorDpi = 72
      grayDpi = 72
      monoDpi = 150
    }

    const gsBin = process.env.GS_EXEC || 'gs'

    async function runPass(inPath: string, outPath: string, _color: number, _gray: number, _mono: number, level: string) {
      const cmd = `${gsBin} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${level} \
        -dCompressFonts=true -dSubsetFonts=true -dEmbedAllFonts=false \
        -dDetectDuplicateImages=true -dFastWebView=true \
        -dDownsampleColorImages=true -dColorImageDownsampleType=/Bicubic -dColorImageResolution=${_color} \
        -dDownsampleGrayImages=true -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=${_gray} \
        -dDownsampleMonoImages=true -dMonoImageDownsampleType=/Bicubic -dMonoImageResolution=${_mono} \
        -dColorImageDownsampleThreshold=1.0 -dGrayImageDownsampleThreshold=1.0 \
        -dAutoFilterColorImages=false -dColorImageFilter=/DCTEncode \
        -dAutoFilterGrayImages=false -dGrayImageFilter=/DCTEncode \
        -dAutoRotatePages=/None -dUseFlateCompression=true \
        -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outPath} ${inPath}`
      await new Promise((resolve, reject) => exec(cmd, (error) => (error ? reject(error) : resolve(undefined))))
    }

    // First pass
    await runPass(inputPath, outputPath, colorDpi, grayDpi, monoDpi, gsLevel)

    let compressedBuffer = await readFile(outputPath)
    const originalSize = file.size
    let finalBuffer = compressedBuffer
    let compressedSize = compressedBuffer.length
    let compressionRatioNum = ((originalSize - compressedSize) / originalSize) * 100
    let compressionRatio = (compressionRatioNum).toFixed(1)
    let note = ''
    let passes = 1

    // If below target and not already extremely aggressive, attempt second pass with stronger settings.
    if (compressionRatioNum < targets[compressionLevel]) {
      const secondInput = outputPath // reuse
      const secondOutput = path.join('/tmp', `output2-${Date.now()}.pdf`)
      let secondLevel = gsLevel
      let c2 = colorDpi
      let g2 = grayDpi
      let m2 = monoDpi
      if (compressionLevel === 'low') {
        // Mildly stronger still prioritizing quality
        c2 = Math.min(colorDpi, 225)
        g2 = Math.min(grayDpi, 225)
        m2 = Math.min(monoDpi, 600)
      } else if (compressionLevel === 'medium') {
        // Push further to approach ~50%
        secondLevel = '/screen'
        c2 = 110
        g2 = 110
        m2 = 220
      } else if (compressionLevel === 'high') {
        // Extreme - already using /screen; drop DPI more
        c2 = 36
        g2 = 36
        m2 = 72
      }
      try {
        await runPass(secondInput, secondOutput, c2, g2, m2, secondLevel)
        compressedBuffer = await readFile(secondOutput)
        finalBuffer = compressedBuffer
        compressedSize = compressedBuffer.length
        compressionRatioNum = ((originalSize - compressedSize) / originalSize) * 100
        compressionRatio = compressionRatioNum.toFixed(1)
        passes = 2
        await unlink(secondOutput).catch(() => {})
      } catch (e) {
        note = 'second-pass-failed'
      }
    }

    // If compression produced a larger file, fall back to original
    if (compressedSize >= originalSize) {
      finalBuffer = originalBuffer
      compressedSize = originalSize
      compressionRatio = '0.0'
      note = 'already-optimized'
    }

    // Clean up temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    return new NextResponse(Buffer.from(finalBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${file.name}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio.toString(),
        'X-Compression-Effective': (compressedSize < originalSize).toString(),
        ...(note ? { 'X-Compression-Note': note } : {}),
        'X-Compression-Passes': passes.toString(),
        'X-Compression-Target-Min': targets[compressionLevel].toString(),
      },
    })
  } catch (error) {
    console.error('Compression error:', error)
    const message = (error as Error)?.message || ''
    if (message.includes('ENOENT') || message.includes('not found')) {
      return NextResponse.json({
        error:
          'Ghostscript (gs) is not installed or not available in PATH. Install Ghostscript (brew install ghostscript) or set env GS_EXEC to the gs binary path.'
      }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to compress PDF. Please ensure the file is a valid PDF.' }, { status: 500 })
  }
}