import * as pdfjsLib from 'pdfjs-dist'

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
}

export { pdfjsLib }
