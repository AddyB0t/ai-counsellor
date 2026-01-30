'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import type { User, UserProfile, ShortlistedUniversity, Task } from '@/types'
import UniversityTaskBox from '@/components/dashboard/UniversityTaskBox'

interface UniversityTaskGroup {
  university: {
    id: string
    name: string
    country: string
    ranking?: number
  }
  category: 'dream' | 'target' | 'safe'
  tasks: Task[]
  completed_count: number
  total_count: number
}

// Inline Lucide Icons
const Icons = {
  arrowRight: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  chat: (
    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
    </svg>
  ),
  graduation: (
    <svg className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Location pin outline */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
      {/* Inner circle */}
      <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Graduation cap inside */}
      <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5v1.5c0 .5 1.1 1 2.5 1s2.5-.5 2.5-1V9.5"/>
      {/* Tassel */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 9v2"/>
    </svg>
  ),
  // Profile section icons
  clipboard: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
    </svg>
  ),
  map: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
    </svg>
  ),
  zap: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
    </svg>
  ),
  graduationSmall: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v4c0 1 2.7 2 6 2s6-1 6-2v-4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 9v2"/>
    </svg>
  ),
  target: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  ),
  globe: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
  wallet: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7H5a2 2 0 010-4h14v4"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5v14a2 2 0 002 2h16v-5"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 12a2 2 0 100 4 2 2 0 000-4z"/>
    </svg>
  ),
  // Profile strength icons
  book: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  ),
  languages: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/>
    </svg>
  ),
  brain: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
    </svg>
  ),
  fileText: (props: { className?: string }) => (
    <svg className={props.className || "w-5 h-5"} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
}

// Icon key type for strength items
type IconKey = 'book' | 'languages' | 'brain' | 'fileText'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [shortlist, setShortlist] = useState<ShortlistedUniversity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [universityTasks, setUniversityTasks] = useState<UniversityTaskGroup[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileData) setProfile(profileData)

    const { data: userProfileData } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (userProfileData) setUserProfile(userProfileData)

    const { data: shortlistData } = await supabase
      .from('shortlisted_universities')
      .select('*, university:universities(*)')
      .eq('user_id', user.id)

    if (shortlistData) setShortlist(shortlistData)

    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_completed', false)
      .limit(5)

    if (tasksData) setTasks(tasksData)

    // Load university-grouped tasks from API
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      await loadUniversityTasks(session.access_token)
    }

    setLoading(false)
  }

  const loadUniversityTasks = async (accessToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/by-university`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUniversityTasks(data)
      }
    } catch (error) {
      console.error('Error loading university tasks:', error)
    }
  }

  const calculateProfileStrength = (): { score: number; items: { label: string; icon: IconKey; status: 'strong' | 'good' | 'weak' }[] } => {
    if (!userProfile) return { score: 75, items: [
      { label: 'Academics', icon: 'book', status: 'strong' },
      { label: 'English', icon: 'languages', status: 'good' },
      { label: 'Aptitude', icon: 'brain', status: 'good' },
      { label: 'Documents', icon: 'fileText', status: 'weak' },
    ] }

    const items: { label: string; icon: IconKey; status: 'strong' | 'good' | 'weak' }[] = []
    let score = 0

    if (userProfile.gpa) {
      const normalized = userProfile.gpa / (userProfile.gpa_scale || 4.0)
      if (normalized >= 0.85) {
        items.push({ label: 'Academics', icon: 'book', status: 'strong' })
        score += 30
      } else if (normalized >= 0.7) {
        items.push({ label: 'Academics', icon: 'book', status: 'good' })
        score += 20
      } else {
        items.push({ label: 'Academics', icon: 'book', status: 'weak' })
        score += 10
      }
    } else {
      items.push({ label: 'Academics', icon: 'book', status: 'strong' })
      score += 25
    }

    if (userProfile.english_test_status === 'Completed') {
      items.push({ label: 'English', icon: 'languages', status: 'strong' })
      score += 25
    } else {
      items.push({ label: 'English', icon: 'languages', status: 'good' })
      score += 18
    }

    if (userProfile.aptitude_test_status === 'Completed') {
      items.push({ label: 'Aptitude', icon: 'brain', status: 'strong' })
      score += 25
    } else {
      items.push({ label: 'Aptitude', icon: 'brain', status: 'good' })
      score += 18
    }

    if (userProfile.sop_status === 'Complete') {
      items.push({ label: 'Documents', icon: 'fileText', status: 'strong' })
      score += 20
    } else if (userProfile.sop_status === 'Draft ready') {
      items.push({ label: 'Documents', icon: 'fileText', status: 'good' })
      score += 14
    } else {
      items.push({ label: 'Documents', icon: 'fileText', status: 'weak' })
      score += 7
    }

    return { score, items }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
              <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
              <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const currentStage = profile?.current_stage || 1
  const { score: profileScore, items: strengthItems } = calculateProfileStrength()
  const lockedCount = shortlist.filter((s) => s.is_locked).length

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-white/60 dark:bg-white/10 rounded-full text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-2 sm:mb-3">
          <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-green-400 rounded-full animate-pulse"></span>
          Stage {currentStage} of 4
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white">
          Hey {profile?.full_name?.split(' ')[0] || 'there'}! <span className="inline-block animate-bounce">👋</span>
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 sm:mt-2 text-base sm:text-lg lg:text-xl">Let's find your dream university today!</p>
      </div>

      {/* Stage Progress */}
      <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
        <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
          Your Adventure Map
          <Icons.map className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
        </h2>
        <div className="flex items-center justify-between">
          {/* Stage 1 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              currentStage > 1
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30'
                : currentStage === 1
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30 animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 1 ? Icons.check : <span className="text-base sm:text-xl lg:text-2xl font-bold">1</span>}
            </div>
            <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-xs sm:text-sm font-medium ${
              currentStage > 1 ? 'text-gray-500 dark:text-gray-400' : currentStage === 1 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 1 ? <span className="hidden sm:inline">Profile ✓</span> : 'Profile'}
              {currentStage > 1 && <span className="sm:hidden">✓</span>}
            </span>
          </div>

          <div className={`flex-1 h-1.5 sm:h-2 lg:h-2.5 mx-1.5 sm:mx-2 lg:mx-4 rounded-full ${currentStage > 1 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

          {/* Stage 2 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              currentStage > 2
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30'
                : currentStage === 2
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30 animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 2 ? Icons.check : <span className="text-base sm:text-xl lg:text-2xl font-bold">2</span>}
            </div>
            <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-xs sm:text-sm font-medium ${
              currentStage > 2 ? 'text-gray-500 dark:text-gray-400' : currentStage === 2 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 2 ? <span className="hidden sm:inline">Discover ✓</span> : <span className="hidden sm:inline">Discover</span>}
              {currentStage > 2 ? <span className="sm:hidden">✓</span> : <span className="sm:hidden">Find</span>}
            </span>
          </div>

          <div className={`flex-1 h-1.5 sm:h-2 lg:h-2.5 mx-1.5 sm:mx-2 lg:mx-4 rounded-full ${currentStage > 2 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

          {/* Stage 3 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              currentStage > 3
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30'
                : currentStage === 3
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30 animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 3 ? Icons.check : <span className="text-base sm:text-xl lg:text-2xl font-bold">3</span>}
            </div>
            <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-xs sm:text-sm font-medium ${
              currentStage > 3 ? 'text-gray-500 dark:text-gray-400' : currentStage === 3 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {currentStage > 3 ? <span className="hidden sm:inline">Finalize ✓</span> : <span className="hidden sm:inline">Finalize</span>}
              {currentStage > 3 ? <span className="sm:hidden">✓</span> : <span className="sm:hidden">Pick</span>}
            </span>
          </div>

          <div className={`flex-1 h-1.5 sm:h-2 lg:h-2.5 mx-1.5 sm:mx-2 lg:mx-4 rounded-full ${currentStage > 3 ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

          {/* Stage 4 */}
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
              currentStage >= 4
                ? 'bg-gradient-to-br from-emerald-400 to-green-500 text-white shadow-emerald-500/30 animate-pulse'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
            }`}>
              <span className="text-base sm:text-xl lg:text-2xl font-bold">4</span>
            </div>
            <span className={`mt-1.5 sm:mt-2 lg:mt-3 text-xs sm:text-sm font-medium ${
              currentStage >= 4 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-400 dark:text-gray-500'
            }`}>
              Apply
            </span>
          </div>
        </div>
      </div>

      {/* Profile & Strength Grid */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Profile Summary */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
          <div className="flex justify-between items-center mb-3 sm:mb-5">
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Your Profile
              <Icons.clipboard className="w-5 h-5 text-emerald-500" />
            </h2>
            <Link href="/profile" className="text-emerald-500 dark:text-emerald-400 text-xs sm:text-sm font-semibold hover:text-emerald-600 dark:hover:text-emerald-300">Edit</Link>
          </div>
          <div className="space-y-2 sm:space-y-3 lg:space-y-4">
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base flex items-center gap-2">
                <Icons.graduationSmall className="w-4 h-4 sm:w-5 sm:h-5" />
                Education
              </span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{userProfile?.education_level || "Bachelor's"}</span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base flex items-center gap-2">
                <Icons.target className="w-4 h-4 sm:w-5 sm:h-5" />
                Target
              </span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{userProfile?.intended_degree || "Master's"}</span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base flex items-center gap-2">
                <Icons.globe className="w-4 h-4 sm:w-5 sm:h-5" />
                Countries
              </span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">{userProfile?.preferred_countries?.join(', ') || 'USA, UK, Canada'}</span>
            </div>
            <div className="flex justify-between items-center p-2 sm:p-3 rounded-lg sm:rounded-xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
              <span className="text-gray-500 dark:text-gray-400 text-sm sm:text-base flex items-center gap-2">
                <Icons.wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                Budget
              </span>
              <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">${((userProfile?.budget_max || 50000) / 1000).toFixed(0)}k/year</span>
            </div>
          </div>
        </div>

        {/* Profile Strength - Responsive 8px grid system */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
            Profile Power
            <Icons.zap className="w-5 h-5 text-emerald-500" />
          </h2>
          <div className="flex flex-col sm:grid sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 lg:gap-8 items-center">
            {/* Hero Score Circle */}
            <div className="flex items-center justify-center">
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32">
                <svg className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 transform -rotate-90" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" stroke="#f3f4f6" className="dark:stroke-gray-700" strokeWidth="10" fill="none"/>
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="url(#gradient)"
                    strokeWidth="10"
                    fill="none"
                    strokeDasharray={`${(profileScore / 100) * 327} 327`}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399"/>
                      <stop offset="100%" stopColor="#10b981"/>
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">{profileScore}</span>
              </div>
            </div>
            {/* Metrics Grid */}
            <div className="grid gap-2 sm:gap-3 lg:gap-4 w-full">
              {strengthItems.map((item) => {
                const IconComponent = Icons[item.icon]
                return (
                  <div key={item.label} className="flex items-center gap-2 sm:gap-3 lg:gap-4 h-7 sm:h-8">
                    <span className="w-6 sm:w-7 lg:w-8 flex items-center justify-center text-gray-500 dark:text-gray-400">
                      <IconComponent className="w-4 h-4 sm:w-5 sm:h-5" />
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{item.label}</span>
                    <span className={`text-[10px] sm:text-xs px-2 sm:px-3 py-0.5 sm:py-1 rounded-full font-semibold min-w-[60px] sm:min-w-[72px] text-center ${
                      item.status === 'strong' ? 'bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400'
                      : item.status === 'good' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                      : 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400'
                    }`}>
                      {item.status === 'strong' ? 'Strong!' : item.status === 'good' ? 'Good' : 'Needs work'}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Link
          href="/counsellor"
          className="group bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 text-white shadow-xl shadow-emerald-500/20 dark:shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/30 dark:hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
              {Icons.chat}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold">Chat with AI Buddy</h3>
              <p className="text-white/80 text-sm sm:text-base">Get personalized advice!</p>
            </div>
            <div className="group-hover:translate-x-2 transition-transform flex-shrink-0">
              {Icons.arrowRight}
            </div>
          </div>
        </Link>

        <Link
          href="/universities"
          className="group bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10 hover:shadow-2xl hover:scale-[1.02] transition-all"
        >
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
            <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {Icons.graduation}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 dark:text-white">Explore Universities</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{shortlist.length} shortlisted • {lockedCount} locked</p>
            </div>
            <div className="text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:translate-x-2 transition-all flex-shrink-0">
              {Icons.arrowRight}
            </div>
          </div>
        </Link>
      </div>

      {/* Application Progress - University Task Boxes */}
      {universityTasks.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4 sm:mb-6 flex items-center gap-3">
            <span className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </span>
            Application Progress
          </h2>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {universityTasks.map((group) => (
              <UniversityTaskBox
                key={group.university.id}
                university={group.university}
                category={group.category}
                tasks={group.tasks}
                completedCount={group.completed_count}
                totalCount={group.total_count}
                onTaskToggle={() => {
                  const supabase = createClient()
                  supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session?.access_token) loadUniversityTasks(session.access_token)
                  })
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lock Warning */}
      {currentStage >= 2 && lockedCount === 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/10 dark:to-orange-500/10 border-2 border-amber-200 dark:border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5">
          <div className="text-3xl sm:text-4xl">🔓</div>
          <div className="flex-1">
            <p className="text-amber-800 dark:text-amber-300 font-bold text-base sm:text-lg">Almost there!</p>
            <p className="text-amber-600 dark:text-amber-400 text-sm sm:text-base">Lock a university to unlock the Applications stage.</p>
          </div>
          <Link
            href="/universities"
            className="w-full sm:w-auto text-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl sm:rounded-2xl font-bold text-base sm:text-lg shadow-lg shadow-amber-500/20 hover:shadow-xl hover:shadow-amber-500/30 transition-shadow"
          >
            Let's Go! 🚀
          </Link>
        </div>
      )}
    </div>
  )
}
