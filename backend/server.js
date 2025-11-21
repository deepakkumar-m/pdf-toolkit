const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { exec } = require('child_process');
const { writeFile, readFile, unlink } = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

require('dotenv').config();

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3001;
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB

// CORS configuration - allow your Netlify frontend
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Original-Size', 'X-Compressed-Size', 'X-Compression-Ratio', 'X-Compression-Effective'],
  credentials: true,
  maxAge: 86400
};

app.use(cors(corsOptions));
app.use(express.json());

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pdf-compression', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'PDF Toolkit Compression API', 
    endpoints: {
      health: 'GET /health',
      compress: 'POST /api/compress'
    }
  });
});

// Compression endpoint
app.post('/api/compress', upload.single('file'), async (req, res) => {
  const startTime = Date.now();
  let inputPath = null;
  let outputPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const compressionLevel = req.body.compressionLevel || 'medium';
    console.log(`[${new Date().toISOString()}] Compressing PDF: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB) - Level: ${compressionLevel}`);

    // Create temp file paths
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    inputPath = path.join('/tmp', `input-${timestamp}-${randomId}.pdf`);
    outputPath = path.join('/tmp', `output-${timestamp}-${randomId}.pdf`);

    // Write uploaded file to temp location
    await writeFile(inputPath, req.file.buffer);

    // Map compression level to Ghostscript settings
    let gsLevel = '/ebook';
    let dpi = 120;
    if (compressionLevel === 'low') {
      gsLevel = '/printer';
      dpi = 200;
    } else if (compressionLevel === 'high') {
      gsLevel = '/screen';
      dpi = 50;
    }

    // Check if Ghostscript is available
    const gsBin = process.env.GS_EXEC || 'gs';
    
    try {
      await execAsync(`${gsBin} -v`);
    } catch (error) {
      console.error('Ghostscript not found:', error.message);
      return res.status(500).json({ 
        error: 'Ghostscript not installed on server. Please contact administrator.',
        details: 'Install ghostscript: apt-get install ghostscript (Ubuntu) or brew install ghostscript (macOS)'
      });
    }

    // Build Ghostscript command
    const gsCmd = `${gsBin} -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${gsLevel} \
      -dCompressFonts=true -dSubsetFonts=true -dEncodeColorImages=true -dEncodeGrayImages=true -dEncodeMonoImages=true \
      -dDetectDuplicateImages=true \
      -dDownsampleColorImages=true -dColorImageDownsampleType=/Bicubic -dColorImageResolution=${dpi} \
      -dDownsampleGrayImages=true -dGrayImageDownsampleType=/Bicubic -dGrayImageResolution=${dpi} \
      -dDownsampleMonoImages=true -dMonoImageDownsampleType=/Subsample -dMonoImageResolution=${dpi} \
      -dAutoRotatePages=/None -dUseFlateCompression=true \
      -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;

    // Execute Ghostscript compression
    console.log(`[${new Date().toISOString()}] Executing Ghostscript...`);
    await execAsync(gsCmd, { maxBuffer: 50 * 1024 * 1024 });

    // Read compressed file
    const compressedBuffer = await readFile(outputPath);
    const originalSize = req.file.size;
    const compressedSize = compressedBuffer.length;
    const compressionRatio = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1);
    const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[${new Date().toISOString()}] Compression complete: ${(originalSize / 1024 / 1024).toFixed(2)} MB → ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% reduction) in ${processingTime}s`);

    // Clean up temp files
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});

    // Send compressed PDF with headers
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="compressed-${req.file.originalname}"`,
      'X-Original-Size': originalSize.toString(),
      'X-Compressed-Size': compressedSize.toString(),
      'X-Compression-Ratio': compressionRatio.toString(),
      'X-Compression-Effective': (compressedSize < originalSize).toString(),
      'X-Processing-Time': processingTime
    });

    res.send(compressedBuffer);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Compression error:`, error);

    // Clean up temp files on error
    if (inputPath) await unlink(inputPath).catch(() => {});
    if (outputPath) await unlink(outputPath).catch(() => {});

    const message = error.message || '';
    if (message.includes('ENOENT') || message.includes('not found')) {
      return res.status(500).json({
        error: 'Ghostscript binary not found',
        details: 'Please ensure Ghostscript is installed on the server'
      });
    }

    res.status(500).json({
      error: 'Failed to compress PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 200 MB.' });
    }
    return res.status(400).json({ error: error.message });
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════╗
║   PDF Toolkit Compression API                      ║
║   Server running on port ${PORT}                      ║
║   Environment: ${process.env.NODE_ENV || 'production'}                     ║
╚════════════════════════════════════════════════════╝
  `);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Compression API: http://localhost:${PORT}/api/compress`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
