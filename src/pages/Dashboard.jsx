// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import {
  FilePenLineIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UploadCloud,
  XIcon,
  ChevronDown,
  Star,
  FileText,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'
import { Copy, Download } from 'lucide-react' 

// Insert this component above Dashboard:
function AnalysisDetails({ details }) {
  // details may be string or object
  const isObject = details && typeof details === 'object'
  const asJsonString = isObject ? JSON.stringify(details, null, 2) : String(details || '')

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(asJsonString)
      toast.success('Copied details to clipboard')
    } catch (e) {
      toast.error('Copy failed')
    }
  }

  const downloadJson = () => {
    const blob = new Blob([asJsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analysis-details-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // If object and has common keys, render them nicely
  if (isObject) {
    const { overall, scoreBreakdown, ...rest } = details

    return (
      <div className="mt-3 space-y-3">
        {/* header actions */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-100 to-purple-50 text-indigo-700 border border-indigo-100 text-sm font-medium">
              Structured
            </div>
            <div className="text-sm text-slate-500">Detailed breakdown</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 px-3 py-1 rounded border hover:shadow-sm bg-white text-xs"
              title="Copy JSON"
            >
              <Copy className="w-4 h-4" /> Copy
            </button>

            <button
              onClick={downloadJson}
              className="inline-flex items-center gap-2 px-3 py-1 rounded border hover:shadow-sm bg-white text-xs"
              title="Download JSON"
            >
              <Download className="w-4 h-4" /> Download
            </button>
          </div>
        </div>

        {/* Overall summary */}
        {overall && (
          <div className="rounded-lg border p-3 bg-gradient-to-r from-white to-slate-50">
            <div className="text-sm font-semibold mb-1">Overall</div>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{overall}</div>
          </div>
        )}

        {/* Score breakdown (if present) */}
        {scoreBreakdown && typeof scoreBreakdown === 'object' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(scoreBreakdown).map(([k, v]) => (
              <div key={k} className="rounded-lg border bg-white p-3">
                <div className="text-xs text-slate-500">{k}</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{String(v.label || v)}</div>
                  {typeof v === 'object' && v.score !== undefined ? (
                    <div className="text-xs text-slate-500">{v.score}</div>
                  ) : null}
                </div>
                {typeof v === 'object' && v.comment && <div className="text-sm text-slate-600 mt-2">{v.comment}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Render other keys as readable cards */}
        {Object.keys(rest).length > 0 && (
          <div className="space-y-2">
            {Object.entries(rest).map(([k, v]) => (
              <div key={k} className="rounded-lg border p-3 bg-white">
                <div className="text-xs text-slate-500">{k}</div>
                {typeof v === 'string' ? (
                  <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{v}</div>
                ) : (
                  // for nested object, pretty-print small JSON
                  <pre className="text-xs mt-2 max-h-36 overflow-auto bg-slate-50 p-2 rounded text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(v, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // fallback: string or complex text -> pretty monospaced block with actions
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-500">Raw details</div>
        <div className="flex items-center gap-2">
          <button onClick={copyToClipboard} className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-white text-xs">
            <Copy className="w-4 h-4" /> Copy
          </button>
          <button onClick={downloadJson} className="inline-flex items-center gap-2 px-3 py-1 rounded border bg-white text-xs">
            <Download className="w-4 h-4" /> Download
          </button>
        </div>
      </div>

      <div className="border rounded-lg p-3 bg-slate-50 max-h-48 overflow-auto">
        <pre className="text-xs whitespace-pre-wrap font-mono text-slate-700">{asJsonString}</pre>
      </div>
    </div>
  )
}


const Dashboard = () => {
  const { user, token } = useSelector(state => state.auth)

  const colors = ['#9333ea', '#d97706', '#dc2626', '#0284c7', '#16a34a']
  const [allResumes, setAllResumes] = useState([])
  const [showCreateResume, setShowCreateResume] = useState(false)
  const [showUploadResume, setShowUploadResume] = useState(false)
  const [title, setTitle] = useState('')
  const [resume, setResume] = useState(null)
  const [editResumeId, setEditResumeId] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  // analysis states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')

  const navigate = useNavigate()

  // load resumes
  const loadAllResumes = async () => {
    try {
      const { data } = await api.get('/api/users/resumes', { headers: { Authorization: token } })
      setAllResumes(data.resumes || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  useEffect(() => {
    loadAllResumes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // create
  const createResume = async event => {
    try {
      event.preventDefault()
      const { data } = await api.post('/api/resumes/create', { title }, { headers: { Authorization: token } })
      setAllResumes(prev => [...prev, data.resume])
      setTitle('')
      setShowCreateResume(false)
      navigate(`/app/builder/${data.resume._id}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  // upload (PDF->text)
  const uploadResume = async event => {
    event.preventDefault()
    setIsLoading(true)
    try {
      // note: pdfToText in-browser may not always work; keep as-is (server-side would be safer)
      const resumeText = await pdfToText(resume)
      const { data } = await api.post(
        '/api/ai/upload-resume',
        { title, resumeText },
        { headers: { Authorization: token } }
      )
      setTitle('')
      setResume(null)
      setShowUploadResume(false)
      navigate(`/app/builder/${data.resumeId}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    setIsLoading(false)
  }

  // edit title
  const editTitle = async event => {
    try {
      event.preventDefault()
      const { data } = await api.put(
        `/api/resumes/update`,
        { resumeId: editResumeId, resumeData: { title } },
        { headers: { Authorization: token } }
      )
      setAllResumes(prev => prev.map(r => (r._id === editResumeId ? { ...r, title } : r)))
      setTitle('')
      setEditResumeId('')
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const deleteResume = async resumeId => {
    try {
      const confirmDelete = window.confirm('Are you sure you want to delete this resume?')
      if (!confirmDelete) return
      const { data } = await api.delete(`/api/resumes/delete/${resumeId}`, {
        headers: { Authorization: token }
      })
      setAllResumes(prev => prev.filter(r => r._id !== resumeId))
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  // load analysis history and normalize
  const loadAnalysisHistory = async resumeId => {
    setAnalysisLoading(true)
    setAnalysisHistory([])
    try {
      const { data } = await api.get(`/api/ai/analysis-history/${resumeId}`, {
        headers: { Authorization: token }
      })

      const rawList = data.history || data.analyses || data.analyses?.analyses || []
      const normalized = (Array.isArray(rawList) ? rawList : []).map(item => {
        let parsedDetails = null
        if (item.details) {
          if (typeof item.details === 'string') {
            try {
              parsedDetails = JSON.parse(item.details)
            } catch (e) {
              parsedDetails = item.details
            }
          } else {
            parsedDetails = item.details
          }
        }

        return {
          ...item,
          summary:
            (parsedDetails && parsedDetails.overall) || item.summary || (typeof parsedDetails === 'string' ? parsedDetails : '') || '',
          details: parsedDetails || item.details || item.fullReport || null,
          score:
            item.score !== undefined && item.score !== null
              ? item.score
              : item.scoreValue !== undefined
              ? item.scoreValue
              : null,
          createdAt: item.createdAt || item.date || item.updatedAt || item.timestamp || null,
          _id: item._id || item.id || `${resumeId}-${Math.random().toString(36).slice(2, 9)}`
        }
      })

      // ensure scores are numbers between 0..100 if present
      const sanitized = normalized.map(it => {
        const s = typeof it.score === 'string' ? Number(it.score) : it.score
        return { ...it, score: Number.isFinite(s) ? Math.max(0, Math.min(100, s)) : null }
      })

      setAnalysisHistory(sanitized)
      setSelectedResumeId(resumeId)
      setShowAnalysisModal(true)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    setAnalysisLoading(false)
  }

  const formatDate = iso => {
    try {
      return new Date(iso).toLocaleString()
    } catch (e) {
      return iso || ''
    }
  }

  // utility for badge/progress color classes (tailwind-ish strings but inline styles used where needed)
  const getBand = score => {
    if (score === null || score === undefined) return { bg: '#f1f5f9', text: '#64748b', bar: '#cbd5e1' } // neutral
    if (score >= 75) return { bg: '#ecfdf5', text: '#166534', bar: '#16a34a' } // green
    if (score >= 45) return { bg: '#fffbeb', text: '#854d0e', bar: '#f59e0b' } // amber
    return { bg: '#fff1f2', text: '#9f1239', bar: '#ef4444' } // red
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ', User'}</h1>
            <p className="text-sm text-slate-500 mt-1">Manage resumes, run AI analysis and iterate faster.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-white shadow">
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Premium</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowCreateResume(true)}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-6 bg-white hover:shadow-xl transition"
            aria-label="Create Resume"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-indigo-300 to-indigo-500 text-white shadow">
              <PlusIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Create Resume</div>
              <div className="text-xs text-slate-400">Start from scratch</div>
            </div>
          </button>

          <button
            onClick={() => setShowUploadResume(true)}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-6 bg-white hover:shadow-xl transition"
            aria-label="Upload Resume"
          >
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-300 to-purple-500 text-white shadow">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">Upload Existing</div>
              <div className="text-xs text-slate-400">PDF → AI-parsed</div>
            </div>
          </button>
        </div>

        <hr className="border-slate-200 my-6" />

        {/* Resume grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {allResumes.map((r, i) => {
            const baseColor = colors[i % colors.length]
            const gradient = `linear-gradient(135deg, ${baseColor}10, ${baseColor}30)`
            const border = `${baseColor}33`
            return (
              <div
                key={r._id || i}
                className="relative rounded-2xl p-4 bg-white shadow hover:shadow-2xl transition transform hover:-translate-y-1"
                style={{ border: `1px solid ${border},`, background: gradient }}
              >
                <button
                  onClick={() => navigate(`/app/builder/${r._id}`)}
                  className="w-full text-left"
                  aria-label={`Open ${r.title}`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white shadow"
                      style={{ background: `linear-gradient(135deg, ${baseColor}, ${baseColor}60)` }}
                    >
                      {r.title?.charAt(0)?.toUpperCase() || 'R'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold truncate">{r.title}</h3>
                        <span className="text-xs text-slate-600">Updated {new Date(r.updatedAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">{r.description || 'Resume created'}</p>
                    </div>
                  </div>
                </button>

                {/* Actions */}
                <div className="absolute right-3 top-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      deleteResume(r._id)
                    }}
                    title="Delete"
                    className="p-1 rounded hover:bg-white/60"
                  >
                    <TrashIcon className="w-4 h-4 text-slate-700" />
                  </button>
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      setEditResumeId(r._id)
                      setTitle(r.title)
                    }}
                    title="Edit"
                    className="p-1 rounded hover:bg-white/60"
                  >
                    <PencilIcon className="w-4 h-4 text-slate-700" />
                  </button>
                </div>

                {/* History / Quick actions */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation()
                      loadAnalysisHistory(r._id)
                    }}
                    className="text-[13px] px-3 py-1 rounded-full bg-white/90 border shadow-sm hover:shadow transition"
                    title="View Analysis History"
                  >
                    History
                  </button>

                  <div className="text-xs text-slate-500">ID: {String(r._id).slice(0, 6)}</div>
                </div>
              </div>
            )
          })}

          {/* empty state */}
          {allResumes.length === 0 && (
            <div className="col-span-full rounded-2xl p-8 bg-white border border-dashed border-slate-200 text-center">
              <Activity className="mx-auto mb-4 w-8 h-8 text-slate-400" />
              <div className="text-sm font-medium">No resumes yet</div>
              <div className="text-xs text-slate-500 mt-1">Create or upload your first resume to get started.</div>
            </div>
          )}
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Create */}
          {showCreateResume && (
            <motion.form
              onSubmit={createResume}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowCreateResume(false)} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-2">Create a Resume</h2>
                <input
                  onChange={e => setTitle(e.target.value)}
                  value={title}
                  type="text"
                  placeholder="Enter resume title"
                  className="w-full px-4 py-2 mb-4 border rounded focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded bg-green-600 text-white hover:bg-green-700">Create Resume</button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateResume(false)
                      setTitle('')
                    }}
                    className="py-2 px-4 rounded border"
                  >
                    Cancel
                  </button>
                </div>
                <XIcon
                  onClick={() => {
                    setShowCreateResume(false)
                    setTitle('')
                  }}
                  className="absolute top-4 right-4 w-5 h-5 text-slate-400 cursor-pointer"
                />
              </div>
            </motion.form>
          )}

          {/* Upload */}
          {showUploadResume && (
            <motion.form
              onSubmit={uploadResume}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowUploadResume(false)} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-2">Upload Resume</h2>

                <input
                  onChange={e => setTitle(e.target.value)}
                  value={title}
                  type="text"
                  placeholder="Enter resume title"
                  className="w-full px-4 py-2 mb-3 border rounded focus:outline-none"
                  required
                />

                <label htmlFor="resume-input" className="block">
                  <div className="flex flex-col items-center justify-center gap-2 border border-dashed rounded-md p-6 cursor-pointer hover:border-green-500 transition text-slate-500">
                    {resume ? <p className="text-sm text-slate-700">{resume.name}</p> : <><UploadCloud className="w-6 h-6" /><div className="text-xs">Click to select a PDF (recommended)</div></>}
                  </div>
                </label>
                <input type="file" id="resume-input" accept=".pdf" hidden onChange={e => setResume(e.target.files[0])} />

                <div className="flex gap-2 mt-4">
                  <button disabled={isLoading} className="flex-1 py-2 rounded bg-green-600 text-white disabled:opacity-60">
                    {isLoading ? <span className="inline-flex items-center gap-2"><LoaderCircleIcon className="w-4 h-4 animate-spin" /> Uploading...</span> : 'Upload Resume'}
                  </button>
                  <button type="button" onClick={() => { setShowUploadResume(false); setTitle(''); setResume(null) }} className="py-2 px-4 rounded border">Cancel</button>
                </div>

                <XIcon onClick={() => { setShowUploadResume(false); setTitle(''); setResume(null) }} className="absolute top-4 right-4 w-5 h-5 text-slate-400 cursor-pointer" />
              </div>
            </motion.form>
          )}

          {/* Edit */}
          {editResumeId && (
            <motion.form
              onSubmit={editTitle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/60" onClick={() => setEditResumeId('')} />
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-50" onClick={e => e.stopPropagation()}>
                <h2 className="text-lg font-semibold mb-2">Edit Resume Title</h2>
                <input
                  onChange={e => setTitle(e.target.value)}
                  value={title}
                  type="text"
                  placeholder="Enter resume title"
                  className="w-full px-4 py-2 mb-4 border rounded focus:outline-none"
                  required
                />
                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded bg-green-600 text-white">Update</button>
                  <button type="button" onClick={() => { setEditResumeId(''); setTitle('') }} className="py-2 px-4 rounded border">Cancel</button>
                </div>
                <XIcon onClick={() => { setEditResumeId(''); setTitle('') }} className="absolute top-4 right-4 w-5 h-5 text-slate-400 cursor-pointer" />
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Analysis History Modal (premium cards) */}
        <AnimatePresence>
          {showAnalysisModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => { setShowAnalysisModal(false); setAnalysisHistory([]); setSelectedResumeId('') }} />

              <motion.div
                initial={{ y: 20, scale: 0.99 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.99 }}
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl p-6 z-50"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">Analysis History</h3>
                    <span className="text-xs text-slate-500">Resume: {String(selectedResumeId).slice(0, 12)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => { setShowAnalysisModal(false); setAnalysisHistory([]); setSelectedResumeId('') }} className="px-3 py-1 border rounded">Close</button>
                  </div>
                </div>

                {analysisLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoaderCircleIcon className="animate-spin w-6 h-6 text-slate-600" />
                  </div>
                ) : analysisHistory.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">No analysis history found for this resume.</div>
                ) : (
                  <div className="space-y-3 max-h-[60vh] overflow-auto pr-2">
                    {analysisHistory.map((item, idx) => {
                      const reverseIndex = analysisHistory.length - idx
                      const band = getBand(item.score)
                      return (
                        <motion.article
                          key={item._id || idx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="relative rounded-2xl p-4 bg-gradient-to-r from-white/80 to-slate-50 border shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-white" style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                                A{reverseIndex}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-semibold truncate">Analysis #{reverseIndex}</h4>
                                  <span className="text-xs text-slate-400">• {formatDate(item.createdAt)}</span>
                                </div>
                                {item.summary && <p className="text-sm text-slate-600 mt-1 line-clamp-2">{item.summary}</p>}
                              </div>
                            </div>

                            <div className="flex-shrink-0 text-right">
                              {item.score !== null && item.score !== undefined ? (
                                <>
                                  <div className="text-xs text-slate-500 mb-1">Score</div>
                                  <div className="inline-flex items-center gap-2">
                                    <div style={{ background: band.bg, color: band.text }} className="w-14 h-7 flex items-center justify-center rounded-full text-sm font-semibold">
                                      {item.score}
                                    </div>
                                  </div>
                                  <div className="mt-2 w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div style={{ width: `${item.score}%`, background: band.bar }} className="h-full rounded-full" />
                                  </div>
                                </>
                              ) : (
                                <div className="text-xs text-slate-400">No score</div>
                              )}
                            </div>
                          </div>

                         {item.details && (
  <details className="mt-3 group/details">
    <summary className="flex items-center gap-2 cursor-pointer select-none rounded-md px-2 py-1 hover:bg-slate-100 transition">
      <FileText className="w-4 h-4 text-slate-500" />
      <span className="text-sm text-slate-600">Details</span>
      <ChevronDown className="w-4 h-4 text-slate-400 ml-1 transition-transform group-open:rotate-180" />
    </summary>

    <div className="mt-2">
      <AnalysisDetails details={item.details} />
    </div>
  </details>
)}

                        </motion.article>
                      )
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Dashboard
