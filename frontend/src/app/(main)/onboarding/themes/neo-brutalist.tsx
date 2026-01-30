'use client'

/**
 * THEME 1: NEO-BRUTALIST
 *
 * Aesthetic: Raw, bold, unapologetic. Heavy black borders, stark contrasts,
 * oversized typography, and intentionally "undesigned" feeling that's
 * actually meticulously crafted.
 *
 * Font: Syne (bold display) + Space Mono (monospace body)
 * Colors: Black, white, electric yellow (#EEFF00), hot coral (#FF6B6B)
 * Signature: Thick 4px borders, offset shadows, uppercase headings
 */

import { useState } from 'react'
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

export default function NeoBrutalistOnboarding() {
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
    <>
      {/* Google Fonts */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

        .neo-brutal {
          --neon-yellow: #EEFF00;
          --hot-coral: #FF6B6B;
          --pure-black: #000000;
          --pure-white: #FFFFFF;
          --off-white: #F5F5F0;
        }

        .brutal-shadow {
          box-shadow: 6px 6px 0px var(--pure-black);
        }

        .brutal-shadow-sm {
          box-shadow: 4px 4px 0px var(--pure-black);
        }

        .brutal-shadow-yellow {
          box-shadow: 6px 6px 0px var(--neon-yellow);
        }

        .brutal-border {
          border: 4px solid var(--pure-black);
        }

        .brutal-border-2 {
          border: 2px solid var(--pure-black);
        }

        .font-syne {
          font-family: 'Syne', sans-serif;
        }

        .font-mono {
          font-family: 'Space Mono', monospace;
        }

        .hover-lift {
          transition: all 0.15s ease;
        }

        .hover-lift:hover {
          transform: translate(-2px, -2px);
          box-shadow: 8px 8px 0px var(--pure-black);
        }

        .hover-lift:active {
          transform: translate(0, 0);
          box-shadow: 4px 4px 0px var(--pure-black);
        }

        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>

      <div className="neo-brutal min-h-screen bg-[var(--off-white)] font-mono">
        {/* Marquee Header */}
        <div className="bg-[var(--pure-black)] py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex">
            {[...Array(10)].map((_, i) => (
              <span key={i} className="text-[var(--neon-yellow)] font-syne font-bold text-sm tracking-widest mx-8">
                STUDY ABROAD ★ BUILD YOUR FUTURE ★ JOIN 10,000+ STUDENTS ★
              </span>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Logo */}
          <div className="flex items-center gap-4 mb-12">
            <div className="w-16 h-16 bg-[var(--neon-yellow)] brutal-border brutal-shadow flex items-center justify-center">
              <span className="font-syne font-extrabold text-3xl">SB</span>
            </div>
            <div>
              <h1 className="font-syne font-extrabold text-2xl tracking-tight">STUDYBUDDY</h1>
              <p className="font-mono text-xs uppercase tracking-widest text-gray-600">Your path to global education</p>
            </div>
          </div>

          {/* Progress - Brutal Style */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="font-syne font-bold text-6xl">{String(step).padStart(2, '0')}</span>
              <span className="font-mono text-sm uppercase tracking-widest">/04</span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-4 brutal-border-2 transition-colors ${
                    s <= step ? 'bg-[var(--neon-yellow)]' : 'bg-white'
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 font-mono text-[10px] uppercase tracking-widest">
              <span className={step >= 1 ? 'text-black' : 'text-gray-400'}>Academic</span>
              <span className={step >= 2 ? 'text-black' : 'text-gray-400'}>Goals</span>
              <span className={step >= 3 ? 'text-black' : 'text-gray-400'}>Budget</span>
              <span className={step >= 4 ? 'text-black' : 'text-gray-400'}>Readiness</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white brutal-border brutal-shadow p-8 md:p-12">
            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-syne font-extrabold text-4xl md:text-5xl uppercase tracking-tight mb-2">
                    ACADEMIC<br />BACKGROUND
                  </h2>
                  <p className="font-mono text-sm text-gray-600 uppercase tracking-widest">
                    Tell us about your education journey
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Current Education Level
                    </label>
                    <select
                      value={data.step1.education_level}
                      onChange={(e) => updateStep1('education_level', e.target.value)}
                      className="w-full p-4 brutal-border-2 bg-white font-mono focus:ring-0 focus:border-black focus:bg-[var(--neon-yellow)] transition-colors"
                    >
                      <option value="">SELECT...</option>
                      {EDUCATION_LEVELS.map((level) => (
                        <option key={level} value={level}>{level.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Degree / Major
                    </label>
                    <input
                      type="text"
                      value={data.step1.degree}
                      onChange={(e) => updateStep1('degree', e.target.value)}
                      className="w-full p-4 brutal-border-2 bg-white font-mono focus:ring-0 focus:border-black focus:bg-[var(--neon-yellow)] transition-colors uppercase"
                      placeholder="E.G., COMPUTER SCIENCE"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                        Graduation Year
                      </label>
                      <input
                        type="number"
                        value={data.step1.graduation_year}
                        onChange={(e) => updateStep1('graduation_year', parseInt(e.target.value))}
                        className="w-full p-4 brutal-border-2 bg-white font-mono focus:ring-0 focus:border-black focus:bg-[var(--neon-yellow)] transition-colors"
                        min={2020}
                        max={2030}
                      />
                    </div>
                    <div>
                      <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                        GPA (Optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={data.step1.gpa || ''}
                        onChange={(e) => updateStep1('gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                        className="w-full p-4 brutal-border-2 bg-white font-mono focus:ring-0 focus:border-black focus:bg-[var(--neon-yellow)] transition-colors"
                        placeholder="3.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-syne font-extrabold text-4xl md:text-5xl uppercase tracking-tight mb-2">
                    STUDY<br />GOALS
                  </h2>
                  <p className="font-mono text-sm text-gray-600 uppercase tracking-widest">
                    Where do you want to go?
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Intended Degree
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DEGREES.map((degree) => (
                        <button
                          key={degree}
                          type="button"
                          onClick={() => updateStep2('intended_degree', degree)}
                          className={`p-4 brutal-border-2 font-mono text-sm uppercase tracking-wider transition-all hover-lift ${
                            data.step2.intended_degree === degree
                              ? 'bg-[var(--neon-yellow)]'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {degree}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Field of Study
                    </label>
                    <input
                      type="text"
                      value={data.step2.field_of_study}
                      onChange={(e) => updateStep2('field_of_study', e.target.value)}
                      className="w-full p-4 brutal-border-2 bg-white font-mono focus:ring-0 focus:border-black focus:bg-[var(--neon-yellow)] transition-colors uppercase"
                      placeholder="E.G., MACHINE LEARNING"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Target Intake
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {INTAKES.map((intake) => (
                        <button
                          key={intake}
                          type="button"
                          onClick={() => updateStep2('target_intake', intake)}
                          className={`p-4 brutal-border-2 font-mono text-xs uppercase tracking-wider transition-all hover-lift ${
                            data.step2.target_intake === intake
                              ? 'bg-[var(--hot-coral)] text-white'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {intake}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-2 block">
                      Preferred Countries
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {COUNTRIES.map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => toggleCountry(country)}
                          className={`p-4 brutal-border-2 font-mono text-xs uppercase tracking-wider transition-all hover-lift ${
                            data.step2.preferred_countries.includes(country)
                              ? 'bg-[var(--pure-black)] text-[var(--neon-yellow)]'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-syne font-extrabold text-4xl md:text-5xl uppercase tracking-tight mb-2">
                    BUDGET &<br />FUNDING
                  </h2>
                  <p className="font-mono text-sm text-gray-600 uppercase tracking-widest">
                    Let&apos;s talk numbers
                  </p>
                </div>

                <div className="space-y-8">
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-4 block">
                      Annual Tuition Budget (USD)
                    </label>
                    <div className="bg-[var(--neon-yellow)] brutal-border p-8 text-center">
                      <span className="font-syne font-extrabold text-6xl md:text-8xl">
                        ${(data.step3.budget_max / 1000).toFixed(0)}K
                      </span>
                      <p className="font-mono text-sm uppercase tracking-widest mt-2">/year maximum</p>
                    </div>
                    <input
                      type="range"
                      min={10000}
                      max={80000}
                      step={5000}
                      value={data.step3.budget_max}
                      onChange={(e) => updateStep3('budget_max', parseInt(e.target.value))}
                      className="w-full mt-4 h-4 bg-black appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #000 0%, #000 ${((data.step3.budget_max - 10000) / 70000) * 100}%, #ccc ${((data.step3.budget_max - 10000) / 70000) * 100}%, #ccc 100%)`
                      }}
                    />
                    <div className="flex justify-between font-mono text-xs mt-1">
                      <span>$10K</span>
                      <span>$80K</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-4 block">
                      Primary Funding Source
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {FUNDING_TYPES.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateStep3('funding_type', type)}
                          className={`p-6 brutal-border font-syne font-bold text-lg uppercase tracking-wider transition-all hover-lift ${
                            data.step3.funding_type === type
                              ? 'bg-[var(--hot-coral)] text-white brutal-shadow-yellow'
                              : 'bg-white brutal-shadow'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-8">
                <div>
                  <h2 className="font-syne font-extrabold text-4xl md:text-5xl uppercase tracking-tight mb-2">
                    APPLICATION<br />READINESS
                  </h2>
                  <p className="font-mono text-sm text-gray-600 uppercase tracking-widest">
                    Where are you in your prep?
                  </p>
                </div>

                <div className="space-y-6">
                  {/* English Test */}
                  <div className="bg-gray-100 brutal-border-2 p-6">
                    <label className="font-mono text-xs uppercase tracking-widest mb-4 block">
                      English Proficiency Test
                    </label>
                    <div className="flex gap-2">
                      {['None', 'IELTS', 'TOEFL'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateStep4('english_test_type', type === 'None' ? null : type.toLowerCase())}
                          className={`flex-1 p-4 brutal-border-2 font-mono text-sm uppercase transition-all ${
                            (type === 'None' && data.step4.english_test_type === null) ||
                            data.step4.english_test_type === type.toLowerCase()
                              ? 'bg-[var(--neon-yellow)]'
                              : 'bg-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aptitude Test */}
                  <div className="bg-gray-100 brutal-border-2 p-6">
                    <label className="font-mono text-xs uppercase tracking-widest mb-4 block">
                      Aptitude Test
                    </label>
                    <div className="flex gap-2">
                      {['None', 'GRE', 'GMAT'].map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => updateStep4('aptitude_test_type', type === 'None' ? null : type.toLowerCase())}
                          className={`flex-1 p-4 brutal-border-2 font-mono text-sm uppercase transition-all ${
                            (type === 'None' && data.step4.aptitude_test_type === null) ||
                            data.step4.aptitude_test_type === type.toLowerCase()
                              ? 'bg-[var(--hot-coral)] text-white'
                              : 'bg-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SOP Status */}
                  <div>
                    <label className="font-mono text-xs uppercase tracking-widest mb-4 block">
                      Statement of Purpose
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {SOP_STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateStep4('sop_status', status)}
                          className={`p-4 brutal-border-2 font-mono text-xs uppercase transition-all hover-lift ${
                            data.step4.sop_status === status
                              ? 'bg-[var(--pure-black)] text-[var(--neon-yellow)]'
                              : 'bg-white'
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

            {/* Navigation */}
            <div className="flex justify-between mt-12 pt-8 border-t-4 border-black">
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                disabled={step === 1}
                className={`flex items-center gap-2 px-8 py-4 font-syne font-bold uppercase tracking-wider transition-all ${
                  step === 1
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'brutal-border-2 hover-lift bg-white'
                }`}
              >
                ← BACK
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-8 py-4 bg-[var(--pure-black)] text-[var(--neon-yellow)] font-syne font-bold uppercase tracking-wider brutal-shadow-yellow hover-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  NEXT →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || loading}
                  className="flex items-center gap-2 px-8 py-4 bg-[var(--hot-coral)] text-white font-syne font-bold uppercase tracking-wider brutal-shadow hover-lift transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'SAVING...' : 'COMPLETE ✓'}
                </button>
              )}
            </div>
          </div>

          {/* Footer tagline */}
          <p className="text-center font-mono text-xs uppercase tracking-widest mt-8 text-gray-500">
            Built for ambitious students who refuse to settle
          </p>
        </div>
      </div>
    </>
  )
}
