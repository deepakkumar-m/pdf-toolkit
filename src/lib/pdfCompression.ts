import { PDFDocument, PDFName, PDFDict, PDFStream, PDFNumber } from 'pdf-lib'
import { pdfjsLib } from './pdfjs'

// Compression settings presets
export const COMPRESSION_PRESETS = {
  balanced: {
    quality: 0.5,
    threshold: 0.95,
    maxWidth: 1800,
    maxHeight: 1800,
    skipSize: 3000,
    scaleFactor: 1.0,
    minDimension: 50,
    smoothing: true,
    smoothingQuality: 'medium' as ImageSmoothingQuality,
    grayscale: false,
    tryWebP: true,
    removeMetadata: true,
    useObjectStreams: true,
    objectsPerTick: 50,
  },
  'high-quality': {
    quality: 0.7,
    threshold: 0.98,
    maxWidth: 2500,
    maxHeight: 2500,
    skipSize: 5000,
    scaleFactor: 1.0,
    minDimension: 50,
    smoothing: true,
    smoothingQuality: 'high' as ImageSmoothingQuality,
    grayscale: false,
    tryWebP: true,
    removeMetadata: true,
    useObjectStreams: true,
    objectsPerTick: 50,
  },
  'small-size': {
    quality: 0.3,
    threshold: 0.95,
    maxWidth: 1200,
    maxHeight: 1200,
    skipSize: 2000,
    scaleFactor: 0.8,
    minDimension: 50,
    smoothing: true,
    smoothingQuality: 'low' as ImageSmoothingQuality,
    grayscale: false,
    tryWebP: true,
    removeMetadata: true,
    useObjectStreams: true,
    objectsPerTick: 50,
  },
  extreme: {
    quality: 0.1,
    threshold: 0.95,
    maxWidth: 1000,
    maxHeight: 1000,
    skipSize: 1000,
    scaleFactor: 0.7,
    minDimension: 30,
    smoothing: false,
    smoothingQuality: 'low' as ImageSmoothingQuality,
    grayscale: true,
    tryWebP: true,
    removeMetadata: true,
    useObjectStreams: true,
    objectsPerTick: 100,
  },
}

export type CompressionLevel = keyof typeof COMPRESSION_PRESETS
export type CompressionSettings = typeof COMPRESSION_PRESETS.balanced

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1]
  const binaryString = atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * Smart compression: Compresses images within PDF without rasterizing the entire document
 */
export async function performSmartCompression(
  arrayBuffer: ArrayBuffer,
  settings: CompressionSettings,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
  })

  if (settings.removeMetadata) {
    try {
      pdfDoc.setTitle('')
      pdfDoc.setAuthor('')
      pdfDoc.setSubject('')
      pdfDoc.setKeywords([])
      pdfDoc.setCreator('')
      pdfDoc.setProducer('')
    } catch (e) {
      console.warn('Could not remove metadata:', e)
    }
  }

  const pages = pdfDoc.getPages()
  let processedImages = 0
  let totalImages = 0

  // Count total images first
  for (const page of pages) {
    const resources = page.node.Resources()
    if (!resources) continue
    const xobjects = resources.lookup(PDFName.of('XObject'))
    if (!(xobjects instanceof PDFDict)) continue
    totalImages += xobjects.entries().length
  }

  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    const page = pages[pageIndex]
    const resources = page.node.Resources()
    if (!resources) continue

    const xobjects = resources.lookup(PDFName.of('XObject'))
    if (!(xobjects instanceof PDFDict)) continue

    for (const [key, value] of xobjects.entries()) {
      const stream = pdfDoc.context.lookup(value)
      if (
        !(stream instanceof PDFStream) ||
        stream.dict.get(PDFName.of('Subtype')) !== PDFName.of('Image')
      )
        continue

      try {
        const imageBytes = stream.getContents()
        if (imageBytes.length < settings.skipSize) continue

        const width =
          stream.dict.get(PDFName.of('Width')) instanceof PDFNumber
            ? (stream.dict.get(PDFName.of('Width')) as PDFNumber).asNumber()
            : 0
        const height =
          stream.dict.get(PDFName.of('Height')) instanceof PDFNumber
            ? (stream.dict.get(PDFName.of('Height')) as PDFNumber).asNumber()
            : 0

        if (width > 0 && height > 0) {
          let newWidth = Math.floor(width * settings.scaleFactor)
          let newHeight = Math.floor(height * settings.scaleFactor)

          if (newWidth > settings.maxWidth || newHeight > settings.maxHeight) {
            const aspectRatio = newWidth / newHeight
            if (newWidth > newHeight) {
              newWidth = Math.min(newWidth, settings.maxWidth)
              newHeight = Math.floor(newWidth / aspectRatio)
            } else {
              newHeight = Math.min(newHeight, settings.maxHeight)
              newWidth = Math.floor(newHeight * aspectRatio)
            }
          }

          if (newWidth < settings.minDimension || newHeight < settings.minDimension) continue

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')!
          canvas.width = newWidth
          canvas.height = newHeight

          const img = new Image()
          const imageUrl = URL.createObjectURL(new Blob([imageBytes]))

          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve()
            img.onerror = reject
            img.src = imageUrl
          })

          ctx.imageSmoothingEnabled = settings.smoothing
          ctx.imageSmoothingQuality = settings.smoothingQuality

          if (settings.grayscale) {
            ctx.filter = 'grayscale(100%)'
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          let bestBytes: Uint8Array | null = null
          let bestSize = imageBytes.length

          // Try JPEG
          const jpegDataUrl = canvas.toDataURL('image/jpeg', settings.quality)
          const jpegBytes = dataUrlToBytes(jpegDataUrl)
          if (jpegBytes.length < bestSize) {
            bestBytes = jpegBytes
            bestSize = jpegBytes.length
          }

          // Try WebP if enabled
          if (settings.tryWebP) {
            try {
              const webpDataUrl = canvas.toDataURL('image/webp', settings.quality)
              const webpBytes = dataUrlToBytes(webpDataUrl)
              if (webpBytes.length < bestSize) {
                bestBytes = webpBytes
                bestSize = webpBytes.length
              }
            } catch (e) {
              // WebP not supported
            }
          }

          // Apply compression if it reduces size
          if (bestBytes && bestSize < imageBytes.length * settings.threshold) {
            ;(stream as any).contents = bestBytes
            stream.dict.set(PDFName.of('Length'), PDFNumber.of(bestSize))
            stream.dict.set(PDFName.of('Width'), PDFNumber.of(canvas.width))
            stream.dict.set(PDFName.of('Height'), PDFNumber.of(canvas.height))
            stream.dict.set(PDFName.of('Filter'), PDFName.of('DCTDecode'))
            stream.dict.delete(PDFName.of('DecodeParms'))
            stream.dict.set(PDFName.of('BitsPerComponent'), PDFNumber.of(8))

            if (settings.grayscale) {
              stream.dict.set(PDFName.of('ColorSpace'), PDFName.of('DeviceGray'))
            }
          }

          URL.revokeObjectURL(imageUrl)
        }
      } catch (error) {
        console.warn('Skipping image:', error)
      }

      processedImages++
      if (onProgress && totalImages > 0) {
        onProgress(Math.round((processedImages / totalImages) * 100))
      }
    }
  }

  const saveOptions = {
    useObjectStreams: settings.useObjectStreams,
    addDefaultPage: false,
    objectsPerTick: settings.objectsPerTick,
  }

  return await pdfDoc.save(saveOptions)
}

/**
 * Photon compression: Rasterizes entire PDF pages to images (fallback method)
 */
export async function performPhotonCompression(
  arrayBuffer: ArrayBuffer,
  level: CompressionLevel,
  onProgress?: (progress: number) => void
): Promise<Uint8Array> {
  const scaleMap = {
    'high-quality': 2.0,
    balanced: 1.5,
    'small-size': 1.2,
    extreme: 1.0,
  }

  const qualityMap = {
    'high-quality': 0.9,
    balanced: 0.6,
    'small-size': 0.4,
    extreme: 0.2,
  }

  const scale = scaleMap[level]
  const quality = qualityMap[level]

  const pdfJsDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const newPdfDoc = await PDFDocument.create()
  const totalPages = pdfJsDoc.numPages

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdfJsDoc.getPage(i)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')!
    canvas.height = viewport.height
    canvas.width = viewport.width

    await page.render({ canvasContext: context, viewport }).promise

    const jpegBlob = await new Promise<Blob>((resolve) =>
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', quality)
    )
    const jpegBytes = await jpegBlob.arrayBuffer()
    const jpegImage = await newPdfDoc.embedJpg(jpegBytes)
    const newPage = newPdfDoc.addPage([viewport.width, viewport.height])
    newPage.drawImage(jpegImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height,
    })

    if (onProgress) {
      onProgress(Math.round((i / totalPages) * 100))
    }
  }

  return await newPdfDoc.save()
}

export interface CompressionResult {
  compressedBytes: Uint8Array
  originalSize: number
  compressedSize: number
  compressionRatio: number
  method: 'smart' | 'photon' | 'auto-smart' | 'auto-photon'
}

/**
 * Automatic compression: Tries smart first, falls back to photon if needed
 */
export async function compressPDF(
  file: File,
  level: CompressionLevel = 'balanced',
  algorithm: 'smart' | 'photon' | 'auto' = 'auto',
  onProgress?: (progress: number, status: string) => void
): Promise<CompressionResult> {
  const arrayBuffer = await file.arrayBuffer()
  const settings = COMPRESSION_PRESETS[level]

  let compressedBytes: Uint8Array
  let method: CompressionResult['method']

  if (algorithm === 'smart') {
    onProgress?.(0, 'Running smart compression...')
    compressedBytes = await performSmartCompression(arrayBuffer, settings, (p) =>
      onProgress?.(p, 'Compressing images...')
    )
    method = 'smart'
  } else if (algorithm === 'photon') {
    onProgress?.(0, 'Running photon compression...')
    compressedBytes = await performPhotonCompression(arrayBuffer, level, (p) =>
      onProgress?.(p, 'Rasterizing pages...')
    )
    method = 'photon'
  } else {
    // Auto mode
    onProgress?.(0, 'Trying smart compression...')
    const smartBytes = await performSmartCompression(arrayBuffer, settings, (p) =>
      onProgress?.(p, 'Compressing images...')
    )

    if (smartBytes.length < file.size) {
      compressedBytes = smartBytes
      method = 'auto-smart'
    } else {
      onProgress?.(0, 'Smart compression insufficient, trying photon...')
      compressedBytes = await performPhotonCompression(arrayBuffer, level, (p) =>
        onProgress?.(p, 'Rasterizing pages...')
      )
      method = 'auto-photon'
    }
  }

  const compressionRatio =
    file.size > 0 ? ((file.size - compressedBytes.length) / file.size) * 100 : 0

  return {
    compressedBytes,
    originalSize: file.size,
    compressedSize: compressedBytes.length,
    compressionRatio,
    method,
  }
}
