'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

interface University {
  id: string
  name: string
  country: string
}

interface SOPDocument {
  id: string
  user_id: string
  university_id: string | null
  university?: University
  title: string
  content: string
  is_draft: boolean
  created_at: string
  updated_at: string
}

interface ShortlistedUniversity {
  university_id: string
  is_locked: boolean
  university: University
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true)
  const [sopDocuments, setSopDocuments] = useState<SOPDocument[]>([])
  const [lockedUniversities, setLockedUniversities] = useState<ShortlistedUniversity[]>([])
  const [selectedSOP, setSelectedSOP] = useState<SOPDocument | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [generating, setGenerating] = useState(false)
  const [selectedUniForGenerate, setSelectedUniForGenerate] = useState<string>('')
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setUserId(user.id)

      // Get access token for API calls
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      setAccessToken(token || null)

      if (!token) {
        console.error('No access token available')
        return
      }

      // Load SOP documents
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sop`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setSopDocuments(data)
      }

      // Load locked universities for generation
      const { data: shortlistData } = await supabase
        .from('shortlisted_universities')
        .select('university_id, is_locked, university:universities(id, name, country)')
        .eq('user_id', user.id)
        .eq('is_locked', true)

      if (shortlistData) {
        setLockedUniversities(shortlistData as unknown as ShortlistedUniversity[])
      }
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateSOP = async () => {
    if (!selectedUniForGenerate || !accessToken) return

    setGenerating(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sop/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ university_id: selectedUniForGenerate })
      })

      if (response.ok) {
        const newSOP = await response.json()
        setSopDocuments(prev => [newSOP, ...prev])
        setShowGenerateModal(false)
        setSelectedUniForGenerate('')
        setSelectedSOP(newSOP)
        setEditingContent(newSOP.content)
      } else {
        const error = await response.json()
        alert(error.detail || 'Failed to generate SOP')
      }
    } catch (error) {
      console.error('Error generating SOP:', error)
      alert('Failed to generate SOP')
    } finally {
      setGenerating(false)
    }
  }

  const saveSOP = async () => {
    if (!selectedSOP || !accessToken) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sop/${selectedSOP.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ content: editingContent })
      })

      if (response.ok) {
        const updated = await response.json()
        setSopDocuments(prev => prev.map(s => s.id === updated.id ? updated : s))
        setSelectedSOP(updated)
      }
    } catch (error) {
      console.error('Error saving SOP:', error)
    }
  }

  const toggleDraftStatus = async (sop: SOPDocument) => {
    if (!accessToken) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sop/${sop.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ is_draft: !sop.is_draft })
      })

      if (response.ok) {
        const updated = await response.json()
        setSopDocuments(prev => prev.map(s => s.id === updated.id ? updated : s))
        if (selectedSOP?.id === updated.id) {
          setSelectedSOP(updated)
        }
      }
    } catch (error) {
      console.error('Error updating SOP status:', error)
    }
  }

  const deleteSOP = async (sopId: string) => {
    if (!accessToken || !confirm('Are you sure you want to delete this SOP?')) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/sop/${sopId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })

      if (response.ok) {
        setSopDocuments(prev => prev.filter(s => s.id !== sopId))
        if (selectedSOP?.id === sopId) {
          setSelectedSOP(null)
          setEditingContent('')
        }
      }
    } catch (error) {
      console.error('Error deleting SOP:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">Loading documents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Documents
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your Statement of Purpose and application documents
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setShowGenerateModal(true)}
          disabled={lockedUniversities.length === 0}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Generate SOP with AI
        </button>
        {lockedUniversities.length === 0 && (
          <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Lock a university to generate SOPs
          </p>
        )}
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Documents List */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-white/10 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-white/10">
              <h2 className="font-bold text-gray-900 dark:text-white">Your SOPs</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {sopDocuments.length} document{sopDocuments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              {sopDocuments.length === 0 ? (
                <div className="p-8 text-center">
                  <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No SOPs yet</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                    Generate your first SOP using AI
                  </p>
                </div>
              ) : (
                sopDocuments.map(sop => (
                  <div
                    key={sop.id}
                    onClick={() => {
                      setSelectedSOP(sop)
                      setEditingContent(sop.content)
                    }}
                    className={`p-4 border-b border-gray-100 dark:border-white/5 cursor-pointer transition-colors ${
                      selectedSOP?.id === sop.id
                        ? 'bg-emerald-50 dark:bg-emerald-500/10'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {sop.title}
                        </h3>
                        {sop.university && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {sop.university.name}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            sop.is_draft
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {sop.is_draft ? 'Draft' : 'Final'}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(sop.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteSOP(sop.id)
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
          {selectedSOP ? (
            <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-white/10 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white">{selectedSOP.title}</h2>
                  {selectedSOP.university && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      For {selectedSOP.university.name}, {selectedSOP.university.country}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleDraftStatus(selectedSOP)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                      selectedSOP.is_draft
                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
                        : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-500/30'
                    }`}
                  >
                    {selectedSOP.is_draft ? 'Mark as Final' : 'Revert to Draft'}
                  </button>
                  <button
                    onClick={saveSOP}
                    className="px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </button>
                </div>
              </div>
              <div className="p-4">
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  className="w-full h-[500px] p-4 bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm leading-relaxed"
                  placeholder="Your Statement of Purpose..."
                />
              </div>
            </div>
          ) : (
            <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-100 dark:border-white/10 h-[600px] flex items-center justify-center">
              <div className="text-center px-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No document selected
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Select a document from the list or generate a new SOP
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Generate SOP with AI</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select a locked university to generate a personalized SOP
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select University
              </label>
              <select
                value={selectedUniForGenerate}
                onChange={(e) => setSelectedUniForGenerate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">Choose a university...</option>
                {lockedUniversities.map(item => (
                  <option key={item.university_id} value={item.university_id}>
                    {item.university.name} - {item.university.country}
                  </option>
                ))}
              </select>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-white/5 flex gap-3">
              <button
                onClick={() => {
                  setShowGenerateModal(false)
                  setSelectedUniForGenerate('')
                }}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={generateSOP}
                disabled={!selectedUniForGenerate || generating || !accessToken}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
