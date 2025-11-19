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
    const inputPath = path.join('/tmp', `input-${Date.now()}.pdf`)
    const outputPath = path.join('/tmp', `output-${Date.now()}.pdf`)
    await writeFile(inputPath, Buffer.from(arrayBuffer))

    // Map compressionLevel to Ghostscript PDFSETTINGS and DPI downsampling
    // /printer ~ low compression (best quality), /ebook ~ medium, /screen ~ high compression
    let gsLevel = '/ebook'
    let dpi = 120
    if (compressionLevel === 'low') {
      gsLevel = '/printer'
      dpi = 200
    } else if (compressionLevel === 'high') {
      gsLevel = '/screen'
      dpi = 50 // more aggressive downsample for high
    }

    const gsBin = process.env.GS_EXEC || 'gs'
    const gsCmd = `${gsBin} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsLevel} \
      -dCompressFonts=true -dSubsetFonts=true -dEncodeColorImages=true -dEncodeGrayImages=true -dEncodeMonoImages=true \
      -dDetectDuplicateImages=true \
      -dDownsampleColorImages=true -dColorImageDownsampleType=/Bicubic -dColorImageResolution=${dpi} \
      -dDownsampleGrayImages=true -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=${dpi} \
      -dDownsampleMonoImages=true -dMonoImageDownsampleType=/Subsample -dMonoImageResolution=${dpi} \
      -dAutoRotatePages=/None -dUseFlateCompression=true \
      -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${outputPath} ${inputPath}`

    await new Promise((resolve, reject) => {
      exec(gsCmd, (error) => (error ? reject(error) : resolve(undefined)))
    })

    const compressedBuffer = await readFile(outputPath)
    const originalSize = file.size
    const compressedSize = compressedBuffer.length
    const compressionRatio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)

    // Clean up temp files
    await unlink(inputPath).catch(() => {})
    await unlink(outputPath).catch(() => {})

    return new NextResponse(Buffer.from(compressedBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compressed-${file.name}"`,
        'X-Original-Size': originalSize.toString(),
        'X-Compressed-Size': compressedSize.toString(),
        'X-Compression-Ratio': compressionRatio.toString(),
        'X-Compression-Effective': (compressedSize < originalSize).toString(),
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