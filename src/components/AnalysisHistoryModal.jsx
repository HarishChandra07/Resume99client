// src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react'
import { FilePenLineIcon, LoaderCircleIcon, PencilIcon, PlusIcon, TrashIcon, UploadCloud, UploadCloudIcon, XIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import api from '../configs/api'
import toast from 'react-hot-toast'
import pdfToText from 'react-pdftotext'
import AnalysisHistoryModal from '../components/AnalysisHistoryModal'

// Premium / modern dashboard with glassmorphism, refined spacing, gradients & micro-interactions
// Tailwind classes are used. If you use shadcn/ui or framer-motion in your stack, you can replace simple elements with those components.

const Dashboard = () => {
  const { user, token } = useSelector(state => state.auth)
  const navigate = useNavigate()

  const accent = {
    indigo: ['#6366f1', '#7c3aed'],
    cyan: ['#06b6d4', '#0891b2'],
    emerald: ['#10b981', '#059669']
  }

  const colors = [accent.indigo, accent.cyan, accent.emerald]

  const [allResumes, setAllResumes] = useState([])
  const [showCreateResume, setShowCreateResume] = useState(false)
  const [showUploadResume, setShowUploadResume] = useState(false)
  const [title, setTitle] = useState('')
  const [resume, setResume] = useState(null)
  const [editResumeId, setEditResumeId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // analysis history states
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisHistory, setAnalysisHistory] = useState([])
  const [selectedResumeId, setSelectedResumeId] = useState('')

  // -------- API calls (kept same logic) --------
  const loadAllResumes = async () => {
    try {
      const { data } = await api.get('/api/users/resumes', { headers: { Authorization: token } })
      setAllResumes(data.resumes || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const createResume = async (event) => {
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

  const uploadResume = async (event) => {
    event.preventDefault()
    setIsLoading(true)
    try {
      const resumeText = await pdfToText(resume)
      const { data } = await api.post('/api/ai/upload-resume', { title, resumeText }, { headers: { Authorization: token } })
      setTitle('')
      setResume(null)
      setShowUploadResume(false)
      navigate(`/app/builder/${data.resumeId}`)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    setIsLoading(false)
  }

  const editTitle = async (event) => {
    try {
      event.preventDefault()
      const { data } = await api.put(`/api/resumes/update`, { resumeId: editResumeId, resumeData: { title } }, { headers: { Authorization: token } })
      setAllResumes(prev => prev.map(r => r._id === editResumeId ? { ...r, title } : r))
      setTitle('')
      setEditResumeId('')
      toast.success(data.message)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const deleteResume = async (resumeId) => {
    try {
      const confirmDel = window.confirm('Are you sure you want to delete this resume?')
      if (confirmDel) {
        const { data } = await api.delete(`/api/resumes/delete/${resumeId}`, { headers: { Authorization: token } })
        setAllResumes(prev => prev.filter(r => r._id !== resumeId))
        toast.success(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const loadAnalysisHistory = async (resumeId) => {
    setAnalysisLoading(true)
    setAnalysisHistory([])
    try {
      const { data } = await api.get(`/api/ai/analysis-history/${resumeId}`, { headers: { Authorization: token } })
      const rawList = data.history || data.analyses || (Array.isArray(data) ? data : []) || []
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
          summary: (parsedDetails && parsedDetails.overall) ? parsedDetails.overall : (item.summary || parsedDetails || ''),
          details: parsedDetails || item.details || item.fullReport || null,
          score: item.score !== undefined ? item.score : (item.scoreValue !== undefined ? item.scoreValue : null),
          createdAt: item.createdAt || item.date || item.updatedAt || item.timestamp || null
        }
      })
      setAnalysisHistory(normalized)
      setSelectedResumeId(resumeId)
      setShowAnalysisModal(true)
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
    setAnalysisLoading(false)
  }

  useEffect(() => { loadAllResumes() /* eslint-disable-line */ }, [])

  const formatDate = (iso) => {
    try { return new Date(iso).toLocaleString() } catch (e) { return iso }
  }

  // ---------- UI helpers ----------
  const renderTopBar = () => (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight text-slate-900 dark:text-white">Hello, <span className="text-emerald-600">{user?.name || 'User'}</span></h1>
        <p className="text-sm text-slate-500 mt-1">Manage resumes • fast actions • AI insights</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-3 bg-white/60 dark:bg-slate-800/60 backdrop-blur rounded-full px-3 py-2 shadow-sm">
          <input placeholder="Search resumes..." className="bg-transparent outline-none text-sm w-48 placeholder:text-slate-400" />
          <button className="px-3 py-1 rounded-full bg-emerald-600 text-white text-sm hover:bg-emerald-700 transition">Search</button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setShowCreateResume(true)} className="inline-flex items-center gap-2 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:scale-[1.02] transition-transform">
            <PlusIcon className="size-4" />
            <span className="text-sm font-medium">New</span>
          </button>

          <button onClick={() => setShowUploadResume(true)} className="inline-flex items-center gap-2 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white px-4 py-2 rounded-lg shadow-md hover:scale-[1.02] transition-transform">
            <UploadCloudIcon className="size-4" />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      </div>
    </div>
  )

  const renderEmpty = () => (
    <div className="w-full rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center bg-gradient-to-b from-white/60 to-white/30 dark:from-slate-900/40">
      <h3 className="text-lg font-semibold">No resumes yet</h3>
      <p className="text-sm text-slate-500 mt-2">Create a resume or upload an existing one to get started with AI analysis.</p>
      <div className="mt-4 flex items-center justify-center gap-3">
        <button onClick={() => setShowCreateResume(true)} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Create</button>
        <button onClick={() => setShowUploadResume(true)} className="px-4 py-2 rounded-lg border">Upload</button>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {renderTopBar()}

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-2 bg-gradient-to-br from-white/70 to-white/50 dark:from-slate-900/60 dark:to-slate-900/40 rounded-2xl p-6 shadow-lg border border-transparent hover:border-slate-200 transition">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Your Resumes</h2>
          <p className="mt-2 text-sm text-slate-500">Quick access to your recent resumes. Click a card to open the builder.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allResumes.length === 0 && renderEmpty()}

            {allResumes.map((resumeItem, index) => {
              const colorPair = colors[index % colors.length]
              const accentStart = colorPair[0]
              const accentEnd = colorPair[1]

              return (
                <div key={resumeItem._id || index} className="relative rounded-xl p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur border shadow-sm hover:shadow-md transition hover:scale-[1.01] cursor-pointer" onClick={() => navigate(`/app/builder/${resumeItem._id}`)}>

                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg" style={{ background: `linear-gradient(135deg, ${accentStart}22, ${accentEnd}18)` }}>
                        <FilePenLineIcon className="size-6" style={{ color: accentEnd }} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white truncate" style={{ maxWidth: 180 }}>{resumeItem.title}</div>
                        <div className="text-xs text-slate-400 mt-1">Updated {resumeItem.updatedAt ? new Date(resumeItem.updatedAt).toLocaleDateString() : '—'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditResumeId(resumeItem._id); setTitle(resumeItem.title) }} className="p-2 rounded-md hover:bg-white/40">
                        <PencilIcon className="size-4 text-slate-600" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deleteResume(resumeItem._id) }} className="p-2 rounded-md hover:bg-rose-50">
                        <TrashIcon className="size-4 text-rose-600" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Scores: <span className="font-medium text-slate-700">{resumeItem.score ?? '—'}</span></div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); loadAnalysisHistory(resumeItem._id) }} className="text-xs px-3 py-1 rounded-md bg-white/80 border">History</button>
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/app/builder/${resumeItem._id}`) }} className="text-xs px-3 py-1 rounded-md bg-indigo-600 text-white">Open</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="rounded-2xl p-6 bg-gradient-to-br from-white/60 to-white/30 dark:from-slate-900/60 dark:to-slate-900/40 shadow-lg border">
          <h3 className="text-sm font-semibold text-slate-700">Account</h3>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white font-bold">{(user?.name || 'U').charAt(0)}</div>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500">{user?.email || '—'}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs text-slate-500">Quick actions</div>
            <div className="mt-3 flex flex-col gap-2">
              <button onClick={() => setShowCreateResume(true)} className="w-full text-left px-3 py-2 rounded-md bg-indigo-50 text-indigo-700">Create resume</button>
              <button onClick={() => setShowUploadResume(true)} className="w-full text-left px-3 py-2 rounded-md border">Upload PDF</button>
              <button className="w-full text-left px-3 py-2 rounded-md bg-white/60 border">Export data</button>
            </div>
          </div>
        </aside>
      </section>

      {/* ---------- Modals (create / upload / edit) ---------- */}
      {showCreateResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Create a Resume</h4>
              <XIcon className="cursor-pointer" onClick={() => { setShowCreateResume(false); setTitle('') }} />
            </div>

            <form onSubmit={createResume} className="mt-4">
              <label className="text-sm text-slate-600">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-300 outline-none" placeholder="e.g. Senior Product Designer" />

              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
                <button type="button" onClick={() => { setShowCreateResume(false); setTitle('') }} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showUploadResume && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Upload Resume</h4>
              <XIcon className="cursor-pointer" onClick={() => { setShowUploadResume(false); setTitle('') }} />
            </div>

            <form onSubmit={uploadResume} className="mt-4">
              <label className="text-sm text-slate-600">Title</label>
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-emerald-300 outline-none" placeholder="Resume title (for your reference)" />

              <label className="block text-sm text-slate-600 mt-4">Select PDF</label>
              <label htmlFor="resume-input" className="mt-2 flex flex-col items-center justify-center gap-2 border-dashed border rounded-lg p-6 cursor-pointer hover:border-emerald-400 transition">
                <UploadCloud className="size-12" />
                <div className="text-sm text-slate-500">Drop or click to select a PDF</div>
                <div className="text-xs text-slate-400">Only PDF supported</div>
              </label>

              <input id="resume-input" type="file" accept=".pdf" hidden onChange={(e) => setResume(e.target.files[0])} />

              <div className="mt-4 flex items-center gap-3">
                <button disabled={isLoading} type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg flex items-center gap-2">
                  {isLoading && <LoaderCircleIcon className="animate-spin size-4 text-white" />}
                  {isLoading ? 'Uploading...' : 'Upload'}
                </button>
                <button type="button" onClick={() => { setShowUploadResume(false); setTitle('') }} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>

              {resume && <div className="mt-3 text-sm text-slate-500">Selected: {resume.name}</div>}
            </form>
          </div>
        </div>
      )}

      {editResumeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-2xl border">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold">Edit Title</h4>
              <XIcon className="cursor-pointer" onClick={() => { setEditResumeId(''); setTitle('') }} />
            </div>

            <form onSubmit={editTitle} className="mt-4">
              <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-2 w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-yellow-300 outline-none" />

              <div className="mt-4 flex items-center gap-3">
                <button type="submit" className="px-4 py-2 bg-yellow-500 text-white rounded-lg">Update</button>
                <button type="button" onClick={() => { setEditResumeId(''); setTitle('') }} className="px-4 py-2 border rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnalysisHistoryModal
        open={showAnalysisModal}
        onClose={() => { setShowAnalysisModal(false); setAnalysisHistory([]); setSelectedResumeId('') }}
        history={analysisHistory}
      />

    </div>
  )
}

export default Dashboard
