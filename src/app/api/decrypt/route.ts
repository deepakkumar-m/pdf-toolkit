import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, unlink, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
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
    const password = formData.get('password') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Invalid file type. Please upload a PDF file.' }, { status: 400 })
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File too large. Max 200 MB per file.' }, { status: 413 })
    }
    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Create temporary file paths
    const tempId = randomBytes(16).toString('hex')
    inputPath = join(tmpdir(), `input-${tempId}.pdf`)
    outputPath = join(tmpdir(), `output-${tempId}.pdf`)

    // Write uploaded file to temp location
    const pdfBytes = await file.arrayBuffer()
    await writeFile(inputPath, Buffer.from(pdfBytes))

    try {
      // Try using qpdf if available
      const qpdfCommand = `qpdf --password="${password.replace(/"/g, '\\"')}" --decrypt "${inputPath}" "${outputPath}"`
      await execAsync(qpdfCommand)
    } catch (qpdfError: any) {
      console.error('qpdf error:', qpdfError)
      
      // Check if it's a password error
      if (
        qpdfError.message?.toLowerCase().includes('invalid password') ||
        qpdfError.message?.toLowerCase().includes('incorrect password') ||
        qpdfError.stderr?.toLowerCase().includes('invalid password')
      ) {
        return NextResponse.json(
          { error: 'Incorrect password. Please try again.' },
          { status: 401 }
        )
      }

      // qpdf not found or other error - provide helpful message
      if (qpdfError.message?.includes('command not found') || qpdfError.code === 'ENOENT') {
        return NextResponse.json(
          { 
            error: 'PDF decryption requires qpdf to be installed on the server. Please contact the administrator or use an alternative method.',
            details: 'qpdf not found'
          },
          { status: 501 }
        )
      }

      throw qpdfError
    }

    // Read the decrypted file
    const decryptedPdfBytes = await readFile(outputPath)

    return new NextResponse(decryptedPdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="unlocked-${file.name}"`,
      },
    })
  } catch (error: any) {
    console.error('Decrypt error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to decrypt PDF. Please ensure the file is encrypted and the password is correct.' },
      { status: 500 }
    )
  } finally {
    // Clean up temporary files
    if (inputPath) {
      try {
        await unlink(inputPath)
      } catch (e) {
        console.warn('Failed to delete input file:', e)
      }
    }
    if (outputPath) {
      try {
        await unlink(outputPath)
      } catch (e) {
        console.warn('Failed to delete output file:', e)
      }
    }
  }
}
