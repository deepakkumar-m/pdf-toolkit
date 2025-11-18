'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Lock, Shield, CheckCircle, Eye, EyeOff, Printer, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

export default function ProtectPdfPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [userPassword, setUserPassword] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')
  const [showUser, setShowUser] = useState(false)
  const [showOwner, setShowOwner] = useState(false)
  const [allowPrint, setAllowPrint] = useState(true)
  const [allowCopy, setAllowCopy] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileUploaded = (files: File[]) => {
    setUploadedFile(files[0] || null)
  }

  const handleProtect = async () => {
    if (!uploadedFile) {
      alert('Please upload a PDF file')
      return
    }
    if (!userPassword.trim()) {
      alert('Please enter a password users will need to open the PDF')
      return
    }

    setIsProcessing(true)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('userPassword', userPassword)
      if (ownerPassword.trim()) formData.append('ownerPassword', ownerPassword)
      formData.append('allowPrint', allowPrint ? '1' : '0')
      formData.append('allowCopy', allowCopy ? '1' : '0')

      const res = await fetch('/api/protect', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to protect PDF')
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `protected-${uploadedFile.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Protect error:', err)
      alert(err?.message || 'Failed to protect PDF. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/tools" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              Back to Tools
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Protect PDF</h1>
              <p className="text-gray-600">Encrypt your PDF with a password and set permissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-gray-700" />
                  Upload PDF & Set Passwords
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFilesUploaded={handleFileUploaded} acceptedFileTypes={['.pdf']} maxFiles={1} toolType="Protect PDF" />

                {uploadedFile && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Open Password (User Password)</label>
                      <div className="relative">
                        <input
                          type={showUser ? 'text' : 'password'}
                          value={userPassword}
                          onChange={(e) => setUserPassword(e.target.value)}
                          placeholder="Required to open the PDF"
                          className="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUser(!showUser)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showUser ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Owner Password (Optional)</label>
                      <div className="relative">
                        <input
                          type={showOwner ? 'text' : 'password'}
                          value={ownerPassword}
                          onChange={(e) => setOwnerPassword(e.target.value)}
                          placeholder="Controls permissions like printing/copying"
                          className="w-full rounded-md border border-gray-300 px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-gray-700"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwner(!showOwner)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          tabIndex={-1}
                        >
                          {showOwner ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 border rounded-md bg-white">
                        <input type="checkbox" checked={allowPrint} onChange={(e) => setAllowPrint(e.target.checked)} />
                        <span className="flex items-center gap-2 text-sm text-gray-700"><Printer className="w-4 h-4" /> Allow printing</span>
                      </label>
                      <label className="flex items-center gap-3 p-3 border rounded-md bg-white">
                        <input type="checkbox" checked={allowCopy} onChange={(e) => setAllowCopy(e.target.checked)} />
                        <span className="flex items-center gap-2 text-sm text-gray-700"><Copy className="w-4 h-4" /> Allow text/image copying</span>
                      </label>
                    </div>

                    <Button onClick={handleProtect} disabled={isProcessing} size="lg" className="w-full sm:w-auto">
                      {isProcessing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Protecting...
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4 mr-2" />
                          Protect PDF
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• User password is required to open the PDF.</li>
                  <li>• Owner password is optional and controls permissions like printing and copying.</li>
                  <li>• Keep your owner password safe; it allows changing permissions later.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
