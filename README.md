# PDF Toolkit - AI-Powered PDF Processing Platform

A modern, professional PDF toolkit similar to LightPDF, built with Next.js 15, TypeScript, and AI integration. This comprehensive platform provides advanced PDF processing capabilities with a beautiful, intuitive interface.

## 🌟 Features

### Core PDF Tools
- **PDF to Word** - Convert PDFs to editable Word documents
- **Chat with PDF** - AI-powered document analysis and Q&A
- **Edit PDF** - Add text, images, and annotations
- **Merge PDF** - Combine multiple PDFs into one
- **Compress PDF** - Reduce file size without quality loss
- **Split PDF** - Extract pages or split documents
- **OCR** - Extract text from scanned documents
- **PDF Security** - Password protection and encryption
- **Format Conversion** - PDF ↔ Word, JPG, PNG, etc.

### AI-Powered Features
- 🤖 **Intelligent Document Analysis** - AI-powered content extraction and summarization
- 💬 **Chat with Documents** - Ask questions about PDF content
- 🔍 **Smart OCR** - Advanced text recognition from images and scans
- 📊 **Content Insights** - Automated document categorization and insights

### Platform Features
- ⚡ **Lightning Fast** - Optimized processing engines
- 🔒 **Enterprise Security** - Bank-level encryption and GDPR compliance
- ☁️ **Cloud Storage** - Sync documents across devices
- 📱 **Mobile Optimized** - Responsive design for all devices
- 🔗 **Developer APIs** - REST APIs and SDKs for integration
- 🎨 **Modern UI** - Beautiful, intuitive interface with dark mode

## 🚀 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + Custom Components
- **Animations**: Framer Motion
- **PDF Processing**: pdf-lib, react-pdf, pdf2pic
- **AI Integration**: OpenAI API
- **File Upload**: react-dropzone
- **Cloud Storage**: Supabase (optional)

## 📦 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/your-username/pdf-toolkit.git
   cd pdf-toolkit
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Add your API keys:
   \`\`\`env
   OPENAI_API_KEY=your_openai_api_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Visit [http://localhost:3000](http://localhost:3000)

## 🛠️ Development

### Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
\`\`\`

### Project Structure

\`\`\`
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── tools/          # Tool pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/             # UI components
│   ├── Hero.tsx        # Hero section
│   ├── ToolsGrid.tsx   # Tools grid
│   ├── Features.tsx    # Features section
│   ├── FileUpload.tsx  # File upload component
│   └── Footer.tsx      # Footer component
└── lib/               # Utility functions
    └── utils.ts       # Common utilities
\`\`\`

## 🔧 Configuration

### Tailwind CSS
The project uses Tailwind CSS with custom configuration for design system consistency. Colors, spacing, and components are customized in \`tailwind.config.js\`.

### Next.js
Configured for optimal performance with:
- App Router for modern routing
- TypeScript for type safety
- Server-side rendering
- Static optimization

### PDF Processing
- **pdf-lib**: Core PDF manipulation
- **react-pdf**: PDF viewing and rendering
- **pdf2pic**: PDF to image conversion

## 🌐 Deployment

### Render (real PDF compression)
This app uses Ghostscript for real PDF compression in `src/app/api/compress/route.ts`. Ensure Ghostscript is installed.

Option A — Render Native (no Docker):

- Build Command:
  
   ```bash
   apt-get update && apt-get install -y ghostscript && npm ci && npm run build
   ```

- Start Command:
  
   ```bash
   npm run start
   ```

Option B — Docker on Render (recommended):

```dockerfile
FROM node:18-bullseye
RUN apt-get update && apt-get install -y ghostscript && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Optional: If Ghostscript is installed with a non-standard binary name or path, set the env var `GS_EXEC` to the full path (defaults to `gs`).

### Vercel (Recommended)
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Docker
\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Environment Variables for Production
\`\`\`env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
\`\`\`

## 📚 API Documentation

### PDF Merge API
\`\`\`typescript
POST /api/merge
Content-Type: multipart/form-data

// Request body: FormData with 'files' field containing PDF files
// Response: Merged PDF file as binary data
\`\`\`

### PDF Conversion API
\`\`\`typescript
POST /api/convert
Content-Type: multipart/form-data

{
  file: File,           // PDF file to convert
  convertTo: 'word'     // Target format
}
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [pdf-lib](https://pdf-lib.js.org/) - PDF manipulation library
- [Lucide React](https://lucide.dev/) - Beautiful icons

## 📞 Support

For support, email support@pdftoolkit.com or join our [Discord community](https://discord.gg/pdftoolkit).

---

Built with ❤️ by [Your Name](https://github.com/your-username)