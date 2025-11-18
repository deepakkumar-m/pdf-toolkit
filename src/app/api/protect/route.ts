import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, readFile, unlink } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { randomBytes } from 'crypto'

const execAsync = promisify(exec)

export const runtime = 'nodejs'
const MAX_UPLOAD_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  let inputPath: string | null = null
  let outputPath: string | null = null

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userPassword = (formData.get('userPassword') as string) || ''
    const ownerPassword = (formData.get('ownerPassword') as string) || userPassword
    const allowPrint = (formData.get('allowPrint') as string) === '1'
    const allowCopy = (formData.get('allowCopy') as string) === '1'
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!userPassword) {
      return NextResponse.json({ error: 'User password is required' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }

    // Write to temp files
    const tempId = randomBytes(16).toString('hex')
    inputPath = join(tmpdir(), `protect-in-${tempId}.pdf`)
    outputPath = join(tmpdir(), `protect-out-${tempId}.pdf`)
    const pdfBytes = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(pdfBytes))

    // Build qpdf command
    // 256-bit encryption; permissions controlled via flags
    const bitStrength = 256
    const esc = (s: string) => s.replace(/"/g, '\\"')

    const flags: string[] = []
    // Permissions: printing
    flags.push(`--print=${allowPrint ? 'full' : 'none'}`)
    // Permissions: extraction
    flags.push(`--extract=${allowCopy ? 'y' : 'n'}`)

    const cmd = `qpdf --encrypt "${esc(userPassword)}" "${esc(ownerPassword)}" ${bitStrength} ${flags.join(' ')} -- "${inputPath}" "${outputPath}"`

    try {
      await execAsync(cmd)
    } catch (e: any) {
      const msg = `${e?.stderr || e?.stdout || e?.message || ''}`.toLowerCase()
      if (msg.includes('command not found') || e?.code === 'ENOENT') {
        return NextResponse.json({ error: 'qpdf is not installed on the server.' }, { status: 501 })
      }
      return NextResponse.json({ error: 'Failed to encrypt PDF. Please try again.' }, { status: 500 })
    }

    const out = await readFile(outputPath)
    return new NextResponse(out, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="protected-${file.name}"`,
      },
    })
  } catch (error) {
    console.error('Protection error:', error)
    return NextResponse.json({ error: 'Failed to protect PDF.' }, { status: 500 })
  } finally {
    if (inputPath) { try { await unlink(inputPath) } catch { /* ignore */ } }
    if (outputPath) { try { await unlink(outputPath) } catch { /* ignore */ } }
  }
}