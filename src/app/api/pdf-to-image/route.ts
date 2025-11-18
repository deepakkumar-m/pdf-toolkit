import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFile, readFile, mkdir, readdir, unlink, rmdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const format = (formData.get('format') as string) || 'jpg'
    const quality = (formData.get('quality') as string) || 'high'
    const dpiParam = formData.get('dpi') as string | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    // Map quality to DPI and JPEG quality
    let dpi = 300
    let jpegQ = 90
    if (quality === 'medium') {
      dpi = 150
      jpegQ = 80
    } else if (quality === 'low') {
      dpi = 72
      jpegQ = 65
    }
    if (dpiParam) {
      const parsed = parseInt(dpiParam, 10)
      if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 600) {
        dpi = parsed
      }
    }

    const gsBin = process.env.GS_EXEC || 'gs'
    const ext = format.toLowerCase() === 'png' ? 'png' : 'jpg'
    const device = ext === 'png' ? 'png16m' : 'jpeg'

    // Write input to /tmp and prepare output directory
    const arrayBuffer = await file.arrayBuffer()
    const inputPath = path.join('/tmp', `pdf2img-input-${Date.now()}.pdf`)
    const outDir = path.join('/tmp', `pdf2img-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    const outPattern = path.join(outDir, `page-%03d.${ext}`)
    await writeFile(inputPath, Buffer.from(arrayBuffer))
    await mkdir(outDir, { recursive: true })

    const gsCmd = `${gsBin} -sDEVICE=${device} -dNOPAUSE -dBATCH -dSAFER -dTextAlphaBits=4 -dGraphicsAlphaBits=4 -r${dpi} ${
      ext === 'jpg' ? `-dJPEGQ=${jpegQ}` : ''
    } -sOutputFile=${outPattern} ${inputPath}`

    await new Promise((resolve, reject) => {
      exec(gsCmd, (error) => (error ? reject(error) : resolve(undefined)))
    })

    // Read generated files
    const files = await readdir(outDir)
    const imageFiles = files
      .filter((f) => f.toLowerCase().endsWith(`.${ext}`))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

    const images: { page: number; name: string; data: number[] }[] = []
    for (let i = 0; i < imageFiles.length; i++) {
      const name = imageFiles[i]
      const full = path.join(outDir, name)
      const buf = await readFile(full)
      images.push({ page: i + 1, name, data: Array.from(buf) })
    }

    // Cleanup temp files
    try {
      await unlink(inputPath)
      await Promise.all(imageFiles.map((n) => unlink(path.join(outDir, n))))
      await rmdir(outDir)
    } catch {}

    return NextResponse.json({
      success: true,
      format: ext,
      quality,
      dpi,
      totalPages: images.length,
      images,
      message: 'PDF converted to images successfully'
    })
    
  } catch (error) {
    console.error('PDF to image conversion error:', error)
    const message = (error as Error)?.message || ''
    if (message.includes('ENOENT') || message.includes('not found')) {
      return NextResponse.json({ 
        error: 'Ghostscript (gs) is not installed or not available in PATH. Install Ghostscript (brew install ghostscript) or set env GS_EXEC.' 
      }, { status: 500 })
    }
    return NextResponse.json({ 
      error: 'Failed to convert PDF to images. Ensure the PDF is valid.' 
    }, { status: 500 })
  }
}