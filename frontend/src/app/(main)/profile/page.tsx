'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { UserProfile } from '@/types'

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'India']
const COUNTRY_FLAGS: Record<string, string> = {
  USA: '🇺🇸',
  UK: '🇬🇧',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  Germany: '🇩🇪',
  India: '🇮🇳',
}
const EDUCATION_LEVELS = ['High School', "Bachelor's", "Master's", 'PhD']
const DEGREES = ["Bachelor's", "Master's", 'MBA', 'PhD']
const INTAKES = ['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027']
const FUNDING_TYPES = ['Self-funded', 'Scholarship', 'Education Loan', 'Mix']
const TEST_STATUSES = ['Not started', 'Scheduled', 'Completed']
const SOP_STATUSES = ['Not started', 'Draft ready', 'Complete']

const COUNTRY_REQUIREMENTS: Record<string, { englishTest: boolean; aptitudeTest: boolean; notes: string }> = {
  USA: { englishTest: true, aptitudeTest: true, notes: 'GRE/GMAT required for most programs' },
  UK: { englishTest: true, aptitudeTest: false, notes: 'GMAT for MBA, GRE optional for others' },
  Canada: { englishTest: true, aptitudeTest: false, notes: 'GRE required for competitive programs' },
  Australia: { englishTest: true, aptitudeTest: false, notes: 'GRE rarely required' },
  Germany: { englishTest: true, aptitudeTest: false, notes: 'German language may be required' },
  India: { englishTest: false, aptitudeTest: false, notes: 'GATE/CAT may be required' },
}

// Icon components
const Icons = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
    </svg>
  ),
  academic: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
    </svg>
  ),
  target: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
    </svg>
  ),
  budget: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  test: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
  ),
  save: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/>
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
    </svg>
  ),
  pen: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
    </svg>
  ),
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Partial<UserProfile>>({})
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (data) setProfile(data)
    setLoading(false)
  }

  const updateField = (field: string, value: unknown) => {
    setProfile({ ...profile, [field]: value })
  }

  const toggleCountry = (country: string) => {
    const countries = profile.preferred_countries || []
    if (countries.includes(country)) {
      updateField('preferred_countries', countries.filter((c) => c !== country))
    } else {
      updateField('preferred_countries', [...countries, country])
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('user_profiles')
        .update({
          ...profile,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)

      if (error) throw error

      setMessage('Profile saved successfully!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl flex items-center justify-center animate-pulse shadow-xl shadow-emerald-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-400 to-green-500 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">Update your info for better recommendations</p>
          </div>
        </div>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${
          message.includes('success')
            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30'
        }`}>
          {message.includes('success') ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          )}
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Academic Background */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {Icons.academic}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Academic Background</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-emerald-500">{Icons.academic}</span>
                Education Level
              </label>
              <select
                value={profile.education_level || ''}
                onChange={(e) => updateField('education_level', e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              >
                <option value="">Select...</option>
                {EDUCATION_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-emerald-500">{Icons.book}</span>
                Degree / Major
              </label>
              <input
                type="text"
                value={profile.degree || ''}
                onChange={(e) => updateField('degree', e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-orange-500">{Icons.chart}</span>
                GPA
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={profile.gpa || ''}
                  onChange={(e) => updateField('gpa', e.target.value ? parseFloat(e.target.value) : null)}
                  placeholder="3.5"
                  className="flex-1 px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                />
                <select
                  value={profile.gpa_scale || 4.0}
                  onChange={(e) => updateField('gpa_scale', parseFloat(e.target.value))}
                  className="px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                >
                  <option value={4.0}>/ 4.0</option>
                  <option value={5.0}>/ 5.0</option>
                  <option value={10.0}>/ 10.0</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-emerald-500">{Icons.calendar}</span>
                Graduation Year
              </label>
              <input
                type="number"
                value={profile.graduation_year || ''}
                onChange={(e) => updateField('graduation_year', parseInt(e.target.value))}
                placeholder="2024"
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Study Goals */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {Icons.target}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Study Goals</h2>
          </div>

          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-emerald-500">{Icons.academic}</span>
                  Intended Degree
                </label>
                <select
                  value={profile.intended_degree || ''}
                  onChange={(e) => updateField('intended_degree', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                >
                  <option value="">Select...</option>
                  {DEGREES.map((degree) => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="text-emerald-500">{Icons.calendar}</span>
                  Target Intake
                </label>
                <select
                  value={profile.target_intake || ''}
                  onChange={(e) => updateField('target_intake', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
                >
                  <option value="">Select...</option>
                  {INTAKES.map((intake) => (
                    <option key={intake} value={intake}>{intake}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <span className="text-orange-500">{Icons.pen}</span>
                Field of Study
              </label>
              <input
                type="text"
                value={profile.field_of_study || ''}
                onChange={(e) => updateField('field_of_study', e.target.value)}
                placeholder="e.g. Artificial Intelligence, Data Science"
                className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <span className="text-blue-500">{Icons.globe}</span>
                Preferred Countries
              </label>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((country) => (
                  <button
                    key={country}
                    type="button"
                    onClick={() => toggleCountry(country)}
                    className={`px-4 py-2.5 rounded-xl border transition-all font-medium text-sm ${
                      profile.preferred_countries?.includes(country)
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-emerald-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white/50 dark:bg-white/[0.05]'
                    }`}
                  >
                    {COUNTRY_FLAGS[country]} {country}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Budget & Funding */}
        <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              {Icons.budget}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Budget & Funding</h2>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Maximum Annual Budget
                </label>
                <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
                  ${((profile.budget_max || 50000) / 1000).toFixed(0)}k / year
                </span>
              </div>
              <input
                type="range"
                min={10000}
                max={80000}
                step={5000}
                value={profile.budget_max || 50000}
                onChange={(e) => updateField('budget_max', parseInt(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #8b5cf6 0%, #ec4899 ${((profile.budget_max || 50000) - 10000) / 700}%, #e5e7eb ${((profile.budget_max || 50000) - 10000) / 700}%, #e5e7eb 100%)`
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>$10k</span>
                <span>$80k</span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Funding Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {FUNDING_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateField('funding_type', type)}
                    className={`px-4 py-3 rounded-xl border transition-all font-medium text-sm ${
                      profile.funding_type === type
                        ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-emerald-500/20'
                        : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white/50 dark:bg-white/[0.05]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Test Requirements */}
        {profile.preferred_countries && profile.preferred_countries.length > 0 && (
          <div className="bg-white/70 dark:bg-white/[0.08] backdrop-blur-sm rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl shadow-emerald-500/5 dark:shadow-emerald-500/10 border border-transparent dark:border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-500/20 dark:to-amber-500/20 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400">
                {Icons.test}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Test Requirements</h2>
            </div>

            {/* Country Notes */}
            <div className="mb-6 p-4 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-500/10 dark:to-green-500/10 rounded-xl space-y-2">
              {profile.preferred_countries.map((country) => (
                <div key={country} className="flex items-start gap-2 text-sm">
                  <span className="text-base">{COUNTRY_FLAGS[country]}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-white">{country}:</strong>{' '}
                    {COUNTRY_REQUIREMENTS[country]?.notes}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* English Test */}
              {profile.preferred_countries.some((c) => COUNTRY_REQUIREMENTS[c]?.englishTest) && (
                <div className="p-4 bg-blue-50/50 dark:bg-blue-500/10 rounded-xl space-y-4">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    English Proficiency Test
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['None', 'IELTS', 'TOEFL'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('english_test_type', type === 'None' ? null : type.toLowerCase())}
                        className={`px-4 py-2.5 rounded-xl border transition-all font-medium text-sm ${
                          (type === 'None' && !profile.english_test_type) ||
                          profile.english_test_type === type.toLowerCase()
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-emerald-500/20'
                            : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white/50 dark:bg-white/[0.05]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {profile.english_test_type && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
                        <select
                          value={profile.english_test_status || 'Not started'}
                          onChange={(e) => updateField('english_test_status', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white text-sm focus:border-emerald-400 transition-all"
                        >
                          {TEST_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {profile.english_test_status === 'Completed' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Score</label>
                          <input
                            type="number"
                            step="0.5"
                            value={profile.english_test_score || ''}
                            onChange={(e) => updateField('english_test_score', e.target.value ? parseFloat(e.target.value) : null)}
                            placeholder={profile.english_test_type === 'ielts' ? '7.5' : '100'}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white text-sm focus:border-emerald-400 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Aptitude Test */}
              {profile.preferred_countries.some((c) => COUNTRY_REQUIREMENTS[c]?.aptitudeTest) && (
                <div className="p-4 bg-amber-50/50 dark:bg-amber-500/10 rounded-xl space-y-4">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Aptitude Test (GRE/GMAT)
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {['None', 'GRE', 'GMAT'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField('aptitude_test_type', type === 'None' ? null : type.toLowerCase())}
                        className={`px-4 py-2.5 rounded-xl border transition-all font-medium text-sm ${
                          (type === 'None' && !profile.aptitude_test_type) ||
                          profile.aptitude_test_type === type.toLowerCase()
                            ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-emerald-500/20'
                            : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white/50 dark:bg-white/[0.05]'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {profile.aptitude_test_type && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Status</label>
                        <select
                          value={profile.aptitude_test_status || 'Not started'}
                          onChange={(e) => updateField('aptitude_test_status', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white text-sm focus:border-emerald-400 transition-all"
                        >
                          {TEST_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      {profile.aptitude_test_status === 'Completed' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Score</label>
                          <input
                            type="number"
                            value={profile.aptitude_test_score || ''}
                            onChange={(e) => updateField('aptitude_test_score', e.target.value ? parseInt(e.target.value) : null)}
                            placeholder={profile.aptitude_test_type === 'gre' ? '320' : '700'}
                            className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl bg-white/50 dark:bg-white/[0.05] text-gray-900 dark:text-white text-sm focus:border-emerald-400 transition-all"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* SOP Status */}
              <div>
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 block">
                  Statement of Purpose (SOP)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {SOP_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateField('sop_status', status)}
                      className={`px-4 py-2.5 rounded-xl border transition-all font-medium text-sm ${
                        profile.sop_status === status
                          ? 'bg-gradient-to-r from-emerald-400 to-green-500 border-transparent text-white shadow-lg shadow-emerald-500/20'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white/50 dark:bg-white/[0.05]'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              {Icons.save}
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}
