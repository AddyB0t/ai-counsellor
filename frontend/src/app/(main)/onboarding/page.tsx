'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import type { OnboardingData } from '@/types'

const COUNTRIES = ['USA', 'UK', 'Canada', 'Australia', 'Germany', 'India']
const EDUCATION_LEVELS = ['High School', 'Bachelor\'s', 'Master\'s', 'PhD']
const DEGREES = ['Bachelor\'s', 'Master\'s', 'MBA', 'PhD']
const INTAKES = ['Fall 2025', 'Spring 2026', 'Fall 2026', 'Spring 2027']
const FUNDING_TYPES = ['Self-funded', 'Scholarship', 'Education Loan', 'Mix']
const TEST_STATUSES = ['Not started', 'Scheduled', 'Completed']
const SOP_STATUSES = ['Not started', 'Draft ready', 'Complete']

// Lucide SVG Icons
const Icons = {
  chevronLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  chevronRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  graduationCap: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<OnboardingData>({
    step1: {
      education_level: '',
      degree: '',
      graduation_year: new Date().getFullYear(),
      gpa: undefined,
      gpa_scale: 4.0,
    },
    step2: {
      intended_degree: '',
      field_of_study: '',
      target_intake: '',
      preferred_countries: [],
    },
    step3: {
      budget_min: 10000,
      budget_max: 50000,
      funding_type: '',
    },
    step4: {
      english_test_type: null,
      english_test_status: 'Not started',
      english_test_score: undefined,
      aptitude_test_type: null,
      aptitude_test_status: 'Not started',
      aptitude_test_score: undefined,
      sop_status: 'Not started',
    },
  })

  const updateStep1 = (field: string, value: unknown) => {
    setData({ ...data, step1: { ...data.step1, [field]: value } })
  }

  const updateStep2 = (field: string, value: unknown) => {
    setData({ ...data, step2: { ...data.step2, [field]: value } })
  }

  const updateStep3 = (field: string, value: unknown) => {
    setData({ ...data, step3: { ...data.step3, [field]: value } })
  }

  const updateStep4 = (field: string, value: unknown) => {
    setData({ ...data, step4: { ...data.step4, [field]: value } })
  }

  const toggleCountry = (country: string) => {
    const countries = data.step2.preferred_countries
    if (countries.includes(country)) {
      updateStep2('preferred_countries', countries.filter((c) => c !== country))
    } else {
      updateStep2('preferred_countries', [...countries, country])
    }
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return data.step1.education_level && data.step1.degree && data.step1.graduation_year
      case 2:
        return (
          data.step2.intended_degree &&
          data.step2.field_of_study &&
          data.step2.target_intake &&
          data.step2.preferred_countries.length > 0
        )
      case 3:
        return data.step3.funding_type
      case 4:
        return data.step4.sop_status
      default:
        return false
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Save user profile data
      const profileData = {
        user_id: user.id,
        ...data.step1,
        ...data.step2,
        ...data.step3,
        ...data.step4,
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'user_id' })

      if (profileError) throw profileError

      // Update profile to mark onboarding as completed
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true, current_stage: 2 })
        .eq('id', user.id)

      if (updateError) throw updateError

      router.push('/dashboard')
    } catch (err) {
      console.error('Onboarding error:', err)
      alert('Failed to save. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419] flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header with Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white">{Icons.graduationCap}</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">StudyBuddy</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
            Step {step} of 4
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  s <= step
                    ? 'bg-gradient-to-r from-emerald-500 to-green-500'
                    : 'bg-gray-200 dark:bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>Academic</span>
            <span>Goals</span>
            <span>Budget</span>
            <span>Readiness</span>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-gray-50 dark:bg-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 p-8">
          {/* Step 1: Academic Background */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Academic Background
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Tell us about your current education.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Education Level
                </label>
                <select
                  value={data.step1.education_level}
                  onChange={(e) => updateStep1('education_level', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select...</option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Degree / Major
                </label>
                <input
                  type="text"
                  value={data.step1.degree}
                  onChange={(e) => updateStep1('degree', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., Computer Science"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Expected Graduation Year
                </label>
                <input
                  type="number"
                  value={data.step1.graduation_year}
                  onChange={(e) => updateStep1('graduation_year', parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  min={2020}
                  max={2030}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GPA (optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={data.step1.gpa || ''}
                    onChange={(e) => updateStep1('gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    placeholder="3.5"
                    min={0}
                    max={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GPA Scale
                  </label>
                  <select
                    value={data.step1.gpa_scale}
                    onChange={(e) => updateStep1('gpa_scale', parseFloat(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  >
                    <option value={4.0}>4.0</option>
                    <option value={5.0}>5.0</option>
                    <option value={10.0}>10.0</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Study Goals */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Study Goals
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                What are you looking to study abroad?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Intended Degree
                </label>
                <select
                  value={data.step2.intended_degree}
                  onChange={(e) => updateStep2('intended_degree', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select...</option>
                  {DEGREES.map((degree) => (
                    <option key={degree} value={degree}>{degree}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Field of Study
                </label>
                <input
                  type="text"
                  value={data.step2.field_of_study}
                  onChange={(e) => updateStep2('field_of_study', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="e.g., Machine Learning, Business Analytics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Intake
                </label>
                <select
                  value={data.step2.target_intake}
                  onChange={(e) => updateStep2('target_intake', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-white/10 rounded-xl bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select...</option>
                  {INTAKES.map((intake) => (
                    <option key={intake} value={intake}>{intake}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Countries
                </label>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map((country) => (
                    <button
                      key={country}
                      type="button"
                      onClick={() => toggleCountry(country)}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        data.step2.preferred_countries.includes(country)
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white shadow-lg'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white dark:bg-white/5'
                      }`}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Budget */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Budget & Funding
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                What&apos;s your budget for studying abroad?
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Tuition Budget (USD)
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600 dark:text-gray-400">$10k</span>
                  <input
                    type="range"
                    min={10000}
                    max={80000}
                    step={5000}
                    value={data.step3.budget_max}
                    onChange={(e) => updateStep3('budget_max', parseInt(e.target.value))}
                    className="flex-1 accent-emerald-500"
                  />
                  <span className="text-gray-600 dark:text-gray-400">$80k</span>
                </div>
                <p className="text-center text-xl font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                  Up to ${(data.step3.budget_max / 1000).toFixed(0)}k/year
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Primary Funding Source
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {FUNDING_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateStep3('funding_type', type)}
                      className={`px-4 py-3 rounded-xl border transition-all ${
                        data.step3.funding_type === type
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white shadow-lg'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-400 bg-white dark:bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Readiness */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Application Readiness
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Where are you in your preparation?
              </p>

              {/* English Test */}
              <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  English Proficiency Test
                </label>
                <div className="flex gap-2">
                  {['None', 'IELTS', 'TOEFL'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateStep4('english_test_type', type === 'None' ? null : type.toLowerCase())}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        (type === 'None' && data.step4.english_test_type === null) ||
                        data.step4.english_test_type === type.toLowerCase()
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {data.step4.english_test_type && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                      <select
                        value={data.step4.english_test_status}
                        onChange={(e) => updateStep4('english_test_status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        {TEST_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    {data.step4.english_test_status === 'Completed' && (
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Score</label>
                        <input
                          type="number"
                          step="0.5"
                          value={data.step4.english_test_score || ''}
                          onChange={(e) => updateStep4('english_test_score', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          placeholder={data.step4.english_test_type === 'ielts' ? '7.5' : '100'}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Aptitude Test */}
              <div className="p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 space-y-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Aptitude Test
                </label>
                <div className="flex gap-2">
                  {['None', 'GRE', 'GMAT'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateStep4('aptitude_test_type', type === 'None' ? null : type.toLowerCase())}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        (type === 'None' && data.step4.aptitude_test_type === null) ||
                        data.step4.aptitude_test_type === type.toLowerCase()
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-white/5'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {data.step4.aptitude_test_type && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Status</label>
                      <select
                        value={data.step4.aptitude_test_status}
                        onChange={(e) => updateStep4('aptitude_test_status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        {TEST_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    {data.step4.aptitude_test_status === 'Completed' && (
                      <div>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Score</label>
                        <input
                          type="number"
                          value={data.step4.aptitude_test_score || ''}
                          onChange={(e) => updateStep4('aptitude_test_score', e.target.value ? parseInt(e.target.value) : undefined)}
                          className="w-full px-3 py-2 border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500"
                          placeholder={data.step4.aptitude_test_type === 'gre' ? '320' : '700'}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* SOP Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statement of Purpose (SOP)
                </label>
                <div className="flex gap-2">
                  {SOP_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => updateStep4('sop_status', status)}
                      className={`px-4 py-2 rounded-xl border transition-all ${
                        data.step4.sop_status === status
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 border-emerald-500 text-white'
                          : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 bg-white dark:bg-white/5'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-colors ${
                step === 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              {Icons.chevronLeft}
              Back
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                {Icons.chevronRight}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canProceed() || loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Complete'}
                {Icons.check}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
