"use client"

import { useState, useEffect, useRef } from 'react'
import * as pdfjs from 'pdfjs-dist'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowLeft, Edit3, Save, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FileUpload from '@/components/FileUpload'

if (typeof window !== 'undefined') {
	pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs'
}

interface TextItem {
	str: string
	x: number
	y: number
	width: number
	height: number
	fontSize: number
	index: number
	page: number
}

interface EditEntry {
	page: number
	index: number
	original: string
	replacement: string
	x: number
	y: number
	width: number
	height: number
	fontSize: number
	scale: number
	ratio?: number
	mode?: string
}

export default function EditPdfPage() {
	const [file, setFile] = useState<File | null>(null)
	const [pdfDoc, setPdfDoc] = useState<any>(null)
	const [currentPage, setCurrentPage] = useState(1)
	const [numPages, setNumPages] = useState(0)
	const [scale, setScale] = useState(1.5)
	const [textItems, setTextItems] = useState<TextItem[]>([])
	const [selected, setSelected] = useState<TextItem | null>(null)
	const [draftValue, setDraftValue] = useState('')
	const [edits, setEdits] = useState<EditEntry[]>([])
	const [rendering, setRendering] = useState(false)
	const [processing, setProcessing] = useState(false)
	const [resultUrl, setResultUrl] = useState<string | null>(null)
	const [resultSummary, setResultSummary] = useState<any[] | null>(null)
	const [directMode, setDirectMode] = useState(false)
	const [showDebug, setShowDebug] = useState(false)

	const canvasRef = useRef<HTMLCanvasElement | null>(null)
	const renderTaskRef = useRef<any>(null)

	const handleUpload = async (files: File[]) => {
		const f = files[0]
		setFile(f)
		setResultUrl(null)
		setEdits([])
		const arrayBuffer = await f.arrayBuffer()
		const loadingTask = pdfjs.getDocument({ data: arrayBuffer })
		const pdf = await loadingTask.promise
		setPdfDoc(pdf)
		setNumPages(pdf.numPages)
		setCurrentPage(1)
	}

	// Render current page & extract text items
	useEffect(() => {
		const run = async () => {
			if (!pdfDoc) return
			setRendering(true)
			if (renderTaskRef.current) {
				try { renderTaskRef.current.cancel() } catch {}
			}
			const page = await pdfDoc.getPage(currentPage)
			const viewport = page.getViewport({ scale })
			const canvas = canvasRef.current
			if (!canvas) return
			const ctx = canvas.getContext('2d')
			if (!ctx) return
			canvas.width = viewport.width
			canvas.height = viewport.height
			renderTaskRef.current = page.render({ canvasContext: ctx, viewport })
			try { await renderTaskRef.current.promise } catch {}
			renderTaskRef.current = null
			const textContent = await page.getTextContent()
			const items: TextItem[] = []
			textContent.items.forEach((item: any, idx: number) => {
				const t = item.transform // [a,b,c,d,e,f]
				const x = t[4] * scale
				const yFromBottom = t[5] * scale
				const yCanvas = viewport.height - yFromBottom
				const fontSize = Math.abs(t[3]) * scale
				items.push({
					str: item.str,
					x,
					y: yCanvas - fontSize,
					width: item.width * scale,
					height: fontSize,
					fontSize,
					index: idx,
					page: currentPage
				})
			})
			setTextItems(items)
			setRendering(false)
		}
		run()
	}, [pdfDoc, currentPage, scale])

	const beginEdit = (ti: TextItem) => {
		if (showDebug) {
			console.log('[PDF DEBUG] Begin edit token', {
				page: ti.page,
				index: ti.index,
				text: ti.str,
				xCanvas: ti.x,
				yCanvasTop: ti.y,
				width: ti.width,
				height: ti.height,
				fontSize: ti.fontSize
			})
		}
		setSelected(ti)
		setDraftValue(ti.str)
	}
	const cancelEdit = () => {
		setSelected(null)
		setDraftValue('')
	}
	const saveEditLocal = () => {
		if (!selected) return
		if (draftValue === selected.str) { cancelEdit(); return }
		// Approximate replacement width using canvas measure with Helvetica fallback
		let replacementWidthPx = draftValue.length * (selected.fontSize * 0.5) // fallback heuristic
		try {
			const measureCanvas = document.createElement('canvas')
			const mctx = measureCanvas.getContext('2d')
			if (mctx) {
				mctx.font = `${selected.fontSize}px Helvetica, Arial, sans-serif`
				replacementWidthPx = mctx.measureText(draftValue).width
			}
		} catch {}
		const ratio = replacementWidthPx / (selected.width || 1)
		let mode: string
		if (ratio <= 1.02) mode = 'fit'
		else if (ratio <= 1.15) mode = 'overflow-minor'
		else mode = 'overflow-risk'
		setEdits(prev => {
			const existingIdx = prev.findIndex(e => e.page === selected.page && e.index === selected.index)
			const entry: EditEntry = {
				page: selected.page,
				index: selected.index,
				original: selected.str,
				replacement: draftValue,
				x: selected.x,
				y: selected.y,
				width: selected.width,
				height: selected.height,
				fontSize: selected.fontSize,
				scale,
				ratio: Number(ratio.toFixed(3)),
				mode
			}
			if (existingIdx >= 0) {
				const clone = [...prev]; clone[existingIdx] = entry; return clone
			}
			return [...prev, entry]
		})
		setTextItems(items => items.map(it => it.page === selected.page && it.index === selected.index ? { ...it, str: draftValue } : it))
		cancelEdit()
	}

	const applyChanges = async () => {
		if (!file || edits.length === 0) return
		setProcessing(true)
		setResultUrl(null)
		setResultSummary(null)
		try {
			const form = new FormData()
			form.append('file', file)
			form.append('edits', JSON.stringify(edits))
			const endpoint = directMode ? '/api/edit-text-direct' : '/api/edit-text'
			const res = await fetch(endpoint, { method: 'POST', body: form })
			if (!res.ok) throw new Error('Edit failed')
			const blob = await res.blob()
			const url = URL.createObjectURL(blob)
			setResultUrl(url)
			// headers may include summary JSON string
			const summaryHeader = res.headers.get('X-Edit-Summary')
			if (summaryHeader) {
				try { setResultSummary(JSON.parse(summaryHeader)) } catch {}
			}
		} catch (e) {
			alert('Failed to apply edits: ' + (e as any).message)
		} finally {
			setProcessing(false)
		}
	}

	const downloadEdited = () => {
		if (!resultUrl || !file) return
		const a = document.createElement('a')
		a.href = resultUrl
		a.download = `edited-${file.name}`
		a.click()
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
						<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
							<Edit3 className="w-6 h-6 text-green-600" />
						</div>
						<div>
							<h1 className="text-3xl font-bold text-gray-900">Edit PDF Text (Experimental)</h1>
							<p className="text-gray-600 text-sm">Attempts true text token replacement. Falls back to overlay if direct modification not possible.</p>
						</div>
					</div>
				</div>
			</div>

			<div className="container mx-auto px-4 py-8">
				{!file && (
					<Card>
						<CardContent className="pt-6">
							<FileUpload
								onFilesUploaded={handleUpload}
								acceptedFileTypes={['.pdf']}
								maxFiles={1}
								toolType="PDF Editing"
							/>
						</CardContent>
					</Card>
				)}

				{file && (
					<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
						<div className="lg:col-span-3">
							<Card>
								<CardContent className="p-4">
									<div className="flex items-center justify-between mb-4">
										<div className="flex items-center gap-2 text-sm flex-wrap">
											<Button variant="outline" size="sm" disabled={currentPage===1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>Prev</Button>
											<span>Page {currentPage} / {numPages}</span>
											<Button variant="outline" size="sm" disabled={currentPage===numPages} onClick={()=>setCurrentPage(p=>Math.min(numPages,p+1))}>Next</Button>
											<Button variant="outline" size="sm" onClick={()=>setScale(s=>Math.min(3,s+0.25))}>Zoom +</Button>
											<Button variant="outline" size="sm" onClick={()=>setScale(s=>Math.max(0.75,s-0.25))}>Zoom -</Button>
											<Button variant="outline" size="sm" onClick={()=>setShowDebug(d=>!d)}>{showDebug? 'Hide Debug' : 'Show Debug'}</Button>
											<Button variant={directMode? 'default':'outline'} size="sm" onClick={()=>setDirectMode(m=>!m)}>{directMode? 'Direct Mode' : 'Overlay Mode'}</Button>
											{rendering && <span className="text-xs text-gray-500">Rendering...</span>}
										</div>
										<div className="text-xs text-gray-500">Edits: {edits.length}</div>
									</div>
									<div className="relative border rounded-lg bg-gray-100 overflow-auto max-h-[800px]">
										<canvas ref={canvasRef} className="block mx-auto" />
										<div className="absolute inset-0 z-10">
											{textItems.filter(t=>t.page===currentPage).map(t=> (
												<span
													key={t.index}
													style={{
														position:'absolute',
														left:t.x,
														top:t.y,
														fontSize:t.fontSize,
														lineHeight:1,
														color: edits.find(e=>e.page===t.page && e.index===t.index)?'#dc2626':'#111',
														background: selected?.index===t.index && selected.page===t.page? 'rgba(255,255,0,0.3)' : 'transparent',
														cursor:'pointer'
													}}
													className={`px-0.5 rounded hover:bg-yellow-200/50 transition-colors pointer-events-auto ${showDebug? 'outline outline-1 outline-blue-400' : ''}`}
													onClick={()=>beginEdit(t)}
												>{t.str || '\u00A0'}</span>
											))}
											{showDebug && textItems.filter(t=>t.page===currentPage).map(t=> (
												<div key={`box-${t.index}`}
													style={{position:'absolute',left:t.x,top:t.y,width:t.width,height:t.height,pointerEvents:'none'}}
													className="text-[10px] text-black/50"
												>
													{/* Bounding box */}
													<div className="absolute inset-0 border border-dashed border-blue-400/50" />
													{/* Baseline line (approximate bottom) */}
													<div className="absolute left-0 right-0" style={{bottom: 0, height: 1, background:'rgba(255,0,0,0.6)'}} />
													{/* Midline */}
													<div className="absolute left-0 right-0" style={{top: t.height/2, height: 1, background:'rgba(0,128,0,0.4)'}} />
													<span className="absolute -top-4 left-0 bg-white/80 px-0.5 rounded border border-blue-300 text-[9px]">#{t.index}</span>
													<span className="absolute -top-4 right-0 bg-white/80 px-0.5 rounded border border-purple-300 text-[9px]">{t.width.toFixed(1)}px</span>
												</div>
											))}
										</div>
									</div>
								</CardContent>
							</Card>
						</div>
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-6">
									<h3 className="font-semibold mb-2">Pending Edits</h3>
									{edits.length===0 && <p className="text-sm text-gray-500">No edits yet. Click text to modify.</p>}
									<ul className="space-y-2 max-h-64 overflow-auto pr-1">
										{edits.map((e,i)=>(
											<li key={i} className="text-xs bg-white border rounded p-2 flex flex-col gap-1">
												<div className="flex justify-between items-center">
													<span className="truncate max-w-[140px]" title={e.original}>{e.original} → <strong>{e.replacement}</strong></span>
													<button
														className="text-red-500 hover:text-red-700 text-[11px]"
														onClick={()=>setEdits(edits.filter((_,idx)=>idx!==i))}
													>✕</button>
												</div>
												{e.ratio !== undefined && (
													<div className="flex items-center gap-2">
														<span className={`px-1 py-[1px] rounded text-[10px] border ${e.mode==='fit'? 'bg-green-50 border-green-400 text-green-700' : e.mode==='overflow-minor'? 'bg-yellow-50 border-yellow-400 text-yellow-700' : 'bg-red-50 border-red-400 text-red-700'}`}>{e.mode} {e.ratio}x</span>
														{e.mode!=='fit' && <span className="text-[10px] text-red-600">May overlap</span>}
													</div>
												)}
											</li>
										))}
									</ul>
									<div className="mt-4 space-y-2">
										{!resultUrl && (
											<Button size="sm" disabled={processing || edits.length===0} className="w-full" onClick={applyChanges}>
												{processing ? (directMode? 'Applying Direct…':'Applying…') : directMode? 'Apply Direct Changes' : 'Apply Changes'}
											</Button>
										)}
										{resultUrl && (
											<>
												<Button size="sm" className="w-full" onClick={downloadEdited}>
													<Download className="w-4 h-4 mr-2"/>Download Edited PDF
												</Button>
												<Button size="sm" variant="outline" className="w-full" onClick={()=>{setResultUrl(null);setResultSummary(null);setEdits([])}}>Reset</Button>
											</>
										)}
										{resultSummary && (
											<div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
												<p className="font-semibold mb-1">Edit Result Summary</p>
												<ul className="space-y-1 max-h-40 overflow-auto">
													{resultSummary.map((r,i)=> {
														const overflow = r.mode !== 'overlay-fit'
														return (
															<li key={i} className={overflow? 'text-red-600' : ''}>
																Page {r.page} • Token {r.index}: <span className="font-medium">{r.mode}</span>{r.ratio && (
																	<span> (ratio {r.ratio}x)</span>
																)}
															</li>
														)
													})}
												</ul>
											</div>
										)}
									</div>
								</CardContent>
							</Card>
							<Card>
								<CardContent className="pt-6 text-xs text-gray-600 space-y-2">
									<h4 className="font-semibold text-gray-800">Limitations</h4>
									<ul className="list-disc pl-4 space-y-1">
										<li>No paragraph reflow</li>
										<li>Subset/encoded fonts may fallback</li>
										<li>Longer replacements may overlap</li>
										<li>Images & vector outlines not editable</li>
									</ul>
								</CardContent>
							</Card>
						</div>
					</div>
				)}
			</div>

			{selected && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="bg-white rounded-lg p-6 w-full max-w-md">
						<h3 className="font-semibold mb-3 text-gray-800">Edit Text</h3>
						<p className="text-xs text-gray-500 mb-2">Page {selected.page} • Token #{selected.index}</p>
						<textarea
							className="w-full border rounded p-2 text-sm h-32"
							value={draftValue}
							onChange={e=>setDraftValue(e.target.value)}
						/>
						<div className="flex gap-2 mt-4">
							<Button size="sm" variant="outline" onClick={cancelEdit}><X className="w-4 h-4 mr-1"/>Cancel</Button>
							<Button size="sm" onClick={saveEditLocal}><Save className="w-4 h-4 mr-1"/>Save</Button>
						</div>
					</motion.div>
				</div>
			)}
		</div>
	)
}
