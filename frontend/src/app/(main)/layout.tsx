'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [currentStage, setCurrentStage] = useState(1)
  const [darkMode, setDarkMode] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Check for saved theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setDarkMode(isDark)
    if (isDark) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleDarkMode = () => {
    const newMode = !darkMode
    setDarkMode(newMode)
    if (newMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  // Re-check auth when pathname changes (e.g., after completing onboarding)
  useEffect(() => {
    checkAuth()
  }, [pathname])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const checkAuth = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Get user profile
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        // Profile might not exist yet - create it
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            onboarding_completed: false,
            current_stage: 1,
          })
          if (insertError) {
            console.error('Profile insert error:', insertError)
          } else {
            // Re-fetch profile after successful insert
            const { data: newProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single()
            profile = newProfile
          }

          // New user - send to onboarding if not already there
          if (pathname !== '/onboarding') {
            router.push('/onboarding')
            return
          }
        }
      }

      if (profile) {
        let stage = profile.current_stage || 1

        // Check if user has locked universities - if so, they should be at stage 4
        if (profile.onboarding_completed) {
          const { data: lockedUnis } = await supabase
            .from('shortlisted_universities')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_locked', true)
            .limit(1)

          if (lockedUnis && lockedUnis.length > 0 && stage < 4) {
            // Auto-fix stage
            await supabase
              .from('profiles')
              .update({ current_stage: 4 })
              .eq('id', user.id)
            stage = 4
          }
        }

        setCurrentStage(stage)

        // Redirect to onboarding if not completed
        if (!profile.onboarding_completed && pathname !== '/onboarding') {
          router.push('/onboarding')
          return
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Auth check error:', err)
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0f1419]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-pulse shadow-lg">
            {/* StudyBuddy Logo - Location Pin + Graduation Cap */}
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none">
              <path d="M12 1C7.58 1 4 4.58 4 9c0 5.5 8 14 8 14s8-8.5 8-14c0-4.42-3.58-8-8-8z" fill="white"/>
              <polygon points="12,6 17,9 12,12 7,9" fill="#10b981"/>
              <path d="M8 9.5v3c0 1 1.8 2 4 2s4-1 4-2v-3l-4 2-4-2z" fill="#10b981"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', minStage: 1, icon: (
      // Lucide LayoutDashboard
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="9" rx="1" />
        <rect x="14" y="3" width="7" height="5" rx="1" />
        <rect x="14" y="12" width="7" height="9" rx="1" />
        <rect x="3" y="16" width="7" height="5" rx="1" />
      </svg>
    )},
    { href: '/counsellor', label: 'AI Buddy', minStage: 2, icon: (
      // Lucide MessageCircle
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
      </svg>
    )},
    { href: '/universities', label: 'Universities', minStage: 2, icon: (
      // Lucide Building2
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18Z" />
        <path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2" />
        <path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2" />
        <path d="M10 6h4" />
        <path d="M10 10h4" />
        <path d="M10 14h4" />
        <path d="M10 18h4" />
      </svg>
    )},
    { href: '/documents', label: 'Documents', minStage: 2, icon: (
      // Lucide FileText
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    )},
    { href: '/applications', label: 'Applications', minStage: 4, icon: (
      // Lucide ClipboardList
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    )},
    { href: '/profile', label: 'Profile', minStage: 1, icon: (
      // Lucide User
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    )},
  ]

  return (
    <div className="min-h-screen flex relative bg-white dark:bg-[#0f1419]">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 dark:bg-[#0f1419]/95 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 z-50 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg p-1.5">
            <img src="/logo.png" alt="StudyBuddy" className="w-full h-full object-contain" />
          </div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">StudyBuddy</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {darkMode ? (
              // Lucide Sun
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              // Lucide Moon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              // Lucide X
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              // Lucide Menu
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <aside className={`lg:hidden fixed top-16 left-0 right-0 bottom-0 bg-white/98 dark:bg-[#0f1419]/98 backdrop-blur-xl z-40 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isLocked = currentStage < item.minStage

            return (
              <Link
                key={item.href}
                href={isLocked ? '#' : item.href}
                onClick={(e) => {
                  if (isLocked) e.preventDefault()
                  else setMobileMenuOpen(false)
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                    : isLocked
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isLocked && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
                )}
              </Link>
            )
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors font-medium"
          >
            {/* Lucide LogOut */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-full w-64 bg-white/95 dark:bg-[#0f1419]/95 backdrop-blur-xl border-r border-gray-200 dark:border-white/10 z-50">
        <div className="p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
              <img src="/logo.png" alt="StudyBuddy" className="w-full h-full object-contain" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">StudyBuddy</span>
          </Link>
        </div>

        <nav className="px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const isLocked = currentStage < item.minStage

            return (
              <Link
                key={item.href}
                href={isLocked ? '#' : item.href}
                onClick={(e) => isLocked && e.preventDefault()}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                    : isLocked
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isLocked && (
                  <span className="ml-auto text-xs bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded-full">Soon</span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-medium"
          >
            {darkMode ? (
              // Lucide Sun
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              // Lucide Moon
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            )}
            <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors font-medium"
          >
            {/* Lucide LogOut */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pt-16 lg:pt-0 lg:ml-64 p-4 sm:p-6 lg:p-8 relative flex-1 min-h-screen bg-gray-50 dark:bg-[#0f1419]">
        {children}
      </main>
    </div>
  )
}
