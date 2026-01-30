'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { formatCurrency } from '@/lib/utils'
import type { University } from '@/types'

// Student avatar images for social proof
const STUDENT_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
]

// University images mapping
const UNIVERSITY_IMAGES: Record<string, string> = {
  'Massachusetts Institute of Technology': '/universities/mit.jpeg',
  'Stanford University': '/universities/stanford.jpg',
  'Harvard University': '/universities/harvard.jpg',
  'California Institute of Technology': '/universities/caltech .jpg',
  'University of Chicago': '/universities/university of chicago.jpg',
  'Princeton University': '/universities/princeton.jpg',
  'Columbia University': '/universities/columbia university.jpg',
  'Yale University': '/universities/yale.jpg',
  'University of Pennsylvania': '/universities/university of pennsylvania.jpg',
  'Duke University': '/universities/duke.jpg',
  'Northwestern University': '/universities/northwestern university.jpg',
  'Carnegie Mellon University': '/universities/carnegie mellon university.jpg',
  'Georgia Institute of Technology': '/universities/georgia institute of technology.jpeg',
  'University of Michigan': '/universities/university of michigan.jpg',
  'University of California Berkeley': '/universities/university of california berkeley.jpg',
  'University of Cambridge': '/universities/cambridge.jpg',
  'University of Oxford': '/universities/oxfored uni.jpg',
  'Imperial College London': '/universities/imperial london.jpg',
  'University of Toronto': '/universities/university of toronto.jpg',
  'McGill University': '/universities/mcgill university.jpg',
  'University of Melbourne': '/universities/university of melbourne.jpg',
  'Technical University of Munich': '/universities/technical university of munich.jpg',
  'Indian Institute of Technology Bombay': '/universities/iit bombay.jpeg',
  'Indian Institute of Technology Delhi': '/universities/iit delhi.jpg',
  'MIT': '/universities/mit.jpeg',
  'Caltech': '/universities/caltech .jpg',
  'UC Berkeley': '/universities/university of california berkeley.jpg',
  'Oxford': '/universities/oxfored uni.jpg',
  'Cambridge': '/universities/cambridge.jpg',
}

const COUNTRY_BACKGROUNDS: Record<string, string> = {
  'USA': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&h=600&fit=crop',
  'UK': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'Canada': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=600&fit=crop',
  'Australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&h=600&fit=crop',
  'Germany': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop',
  'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=600&fit=crop',
}



// Available countries for filter
const COUNTRIES = ['All', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'India']

// Sort options
const SORT_OPTIONS = [
  { value: 'ranking', label: 'Ranking' },
  { value: 'tuition_low', label: 'Tuition: Low to High' },
  { value: 'tuition_high', label: 'Tuition: High to Low' },
  { value: 'acceptance', label: 'Acceptance Rate' },
]

export default function LandingPage() {
  const [showVideo, setShowVideo] = useState(false)
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [sortBy, setSortBy] = useState('ranking')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [previewPlaying, setPreviewPlaying] = useState(false)
  const previewVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    // Set video playback speed to 0.7x (slower)
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7
    }

    // Load universities
    loadUniversities()
  }, [])

  const loadUniversities = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('universities')
      .select('*')
      .order('ranking', { ascending: true })
      .limit(50) // Load more for filtering

    if (data) setUniversities(data)
    setLoading(false)
  }

  const getUniversityImage = (university: University) => {
    return UNIVERSITY_IMAGES[university.name] || COUNTRY_BACKGROUNDS[university.country] || COUNTRY_BACKGROUNDS['USA']
  }

  // Filter and sort universities
  const filteredUniversities = universities
    .filter(uni => {
      // Search filter
      if (searchQuery && !uni.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }
      // Country filter
      if (selectedCountry !== 'All' && uni.country !== selectedCountry) {
        return false
      }
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'ranking':
          return (a.ranking || 999) - (b.ranking || 999)
        case 'tuition_low':
          return (a.tuition_max || 0) - (b.tuition_max || 0)
        case 'tuition_high':
          return (b.tuition_max || 0) - (a.tuition_max || 0)
        case 'acceptance':
          return (b.acceptance_rate || 0) - (a.acceptance_rate || 0)
        default:
          return 0
      }
    })
    .slice(0, 12) // Limit to 12 for display

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Video Background Hero - Shorter */}
      <div className="relative min-h-[70vh] md:min-h-[75vh]">
        {/* Video */}
        <div className="absolute inset-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            loop
            muted
            playsInline
            className="absolute top-1/2 left-1/2 min-w-full min-h-full object-cover"
            style={{ transform: 'translate(-50%, -50%)' }}
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* Navigation */}
        <nav className="relative z-50 bg-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
                  <img src="/logo.png" alt="StudyBuddy" className="w-full h-full object-contain" />
                </div>
                <span className="text-xl font-bold text-white">StudyBuddy</span>
              </div>

              {/* Desktop Nav Links */}
              <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-gray-200 hover:text-white transition-colors">Home</Link>
                <Link href="#features" className="text-gray-200 hover:text-white transition-colors">Features</Link>
                <Link href="#universities" className="text-gray-200 hover:text-white transition-colors">Universities</Link>
              </div>

              {/* CTA */}
              <Link
                href="/signup"
                className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2.5 rounded-full font-medium text-[15px] transition-all hover:shadow-lg"
              >
                Join StudyBuddy →
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex items-center py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Side - Text */}
              <div>
                {/* Badge */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {/* Lucide Trophy icon */}
                    <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 2H6v7a6 6 0 1012 0V2z" />
                    </svg>
                    <span className="text-white text-sm font-medium">#1 Study Abroad Platform</span>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <span className="text-white/80 text-sm">Since 2024</span>
                </div>

                {/* Main Heading - Nautilus Monoline Bold, larger for impact */}
                <h1 className="hero-headline text-[52px] sm:text-[64px] lg:text-[72px] text-white leading-[1.1] mb-5">
                  Your studies matter.
                </h1>
                <p className="hero-subtext text-[22px] sm:text-[26px] lg:text-[28px] text-white/90 mb-8 leading-[1.5]">
                  Find a university that actually fits you.
                </p>

                {/* Bullet Points - Larger text with Lucide icons */}
                <div className="space-y-4 mb-10">
                  <div className="flex items-center gap-4 text-white hero-subtext text-[18px] sm:text-[20px] leading-[1.6]">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span><span className="underline decoration-dotted decoration-white/50 underline-offset-4">Get matched</span> with universities that suit your profile</span>
                  </div>
                  <div className="flex items-center gap-4 text-white hero-subtext text-[18px] sm:text-[20px] leading-[1.6]">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M9 17V9m4 8v-5m4 5v-8" />
                      </svg>
                    </div>
                    <span><span className="underline decoration-dotted decoration-white/50 underline-offset-4">Compare universities</span> on cost, admissions, and outcomes</span>
                  </div>
                  <div className="flex items-center gap-4 text-white hero-subtext text-[18px] sm:text-[20px] leading-[1.6]">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                      </svg>
                    </div>
                    <span><span className="underline decoration-dotted decoration-white/50 underline-offset-4">Discover programs</span> across countries and intakes</span>
                  </div>
                  <div className="flex items-center gap-4 text-white hero-subtext text-[18px] sm:text-[20px] leading-[1.6]">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" />
                        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" stroke="none" />
                      </svg>
                    </div>
                    <span><span className="underline decoration-dotted decoration-white/50 underline-offset-4">Get step-by-step guidance</span> from shortlisting to application</span>
                  </div>
                  <div className="flex items-center gap-4 text-white hero-subtext text-[18px] sm:text-[20px] leading-[1.6]">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                      </svg>
                    </div>
                    <span>Reviewed by counselors, powered by data</span>
                  </div>
                </div>

                {/* Student Avatars Row */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex -space-x-2">
                    {STUDENT_AVATARS.slice(0, 10).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`Student ${i + 1}`}
                        className="w-8 h-8 rounded-full border-2 border-white/30 object-cover"
                      />
                    ))}
                    <div className="w-8 h-8 rounded-full border-2 border-white/30 bg-emerald-500 flex items-center justify-center text-xs font-bold text-white">
                      1K+
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Video Preview & CTA (Nomad List Style) */}
              <div className="flex flex-col items-center lg:items-end">
                {/* Video Preview Card - Larger */}
                <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden w-[300px] md:w-[340px]">
                  {/* Video Thumbnail */}
                  <div className="relative h-[160px] md:h-[180px]">
                    {/* Video element - paused on first frame with transparency */}
                    <video
                      ref={previewVideoRef}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${previewPlaying ? 'opacity-100' : 'opacity-70'}`}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      onEnded={() => setPreviewPlaying(false)}
                    >
                      <source src="/preview-video.mp4#t=0.5" type="video/mp4" />
                    </video>
                    {/* Dark overlay for better contrast when not playing */}
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/40 to-black/20 transition-opacity duration-300 ${previewPlaying ? 'opacity-0' : 'opacity-100'}`} />
                    {/* Play Button Overlay - only show when not playing */}
                    {!previewPlaying && (
                      <button
                        onClick={() => {
                          if (previewVideoRef.current) {
                            previewVideoRef.current.play()
                            setPreviewPlaying(true)
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center group"
                      >
                        <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          {/* Lucide Play icon */}
                          <svg className="w-6 h-6 text-emerald-500 ml-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
                          </svg>
                        </div>
                      </button>
                    )}
                    {/* Pause overlay when playing */}
                    {previewPlaying && (
                      <button
                        onClick={() => {
                          if (previewVideoRef.current) {
                            previewVideoRef.current.pause()
                            setPreviewPlaying(false)
                          }
                        }}
                        className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                          {/* Pause icon */}
                          <svg className="w-6 h-6 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                          </svg>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Email Input & Join Button */}
                  <div className="p-4">
                    <input
                      type="email"
                      placeholder="Type your email..."
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg mb-3 focus:outline-none focus:border-emerald-500 text-gray-900 text-[14px]"
                    />
                    <Link
                      href="/signup"
                      className="w-full block text-center bg-teal-500 hover:bg-teal-600 text-white px-4 py-2.5 rounded-lg font-medium text-[14px] transition-all"
                    >
                      Join StudyBuddy →
                    </Link>
                    <p className="text-center text-gray-400 text-[11px] mt-2">
                      If you already have an account, we&apos;ll log you in
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Press Section - Editorial Style */}
      <section className="py-12 pb-20 bg-[#faf8f5]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* As Seen On Label */}
          <p className="text-center text-gray-400 text-[11px] uppercase tracking-[0.2em] font-medium mb-6">as seen on</p>

          {/* Publication Logos Row - Text-based for reliability */}
          <div className="flex items-center justify-center gap-8 md:gap-12 mb-14 flex-wrap">
            {/* The New York Times */}
            <span className="text-[17px] md:text-[19px] text-gray-600 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontStyle: 'italic' }}>The New York Times</span>

            {/* BBC - Block style */}
            <div className="flex gap-0.5">
              <span className="bg-gray-800 text-white text-[13px] md:text-[15px] font-bold px-1.5 py-0.5">B</span>
              <span className="bg-gray-800 text-white text-[13px] md:text-[15px] font-bold px-1.5 py-0.5">B</span>
              <span className="bg-gray-800 text-white text-[13px] md:text-[15px] font-bold px-1.5 py-0.5">C</span>
            </div>

            {/* CNN */}
            <span className="text-[20px] md:text-[24px] font-black tracking-tight text-red-600" style={{ fontFamily: 'Arial, sans-serif' }}>CNN</span>

            {/* Forbes */}
            <span className="text-[17px] md:text-[19px] text-gray-700 font-bold uppercase tracking-wider" style={{ fontFamily: 'Georgia, serif' }}>Forbes</span>

            {/* TechCrunch */}
            <span className="text-[16px] md:text-[18px] font-bold text-green-600 tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>TechCrunch</span>

            {/* Wired */}
            <span className="text-[17px] md:text-[19px] text-gray-700 font-black uppercase tracking-[0.15em]" style={{ fontFamily: 'Arial, sans-serif' }}>WIRED</span>
          </div>

          {/* Quote Cards - Three White Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Card 1 - NYT */}
            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]" style={{ transform: 'rotate(-1deg)' }}>
              <p className="text-gray-700 text-[14px] leading-[1.75] font-normal text-center mb-6">
                &ldquo;A practical way for students to narrow down university options without feeling overwhelmed.&rdquo;
              </p>
              <div className="border-t border-gray-100 pt-4 flex justify-center">
                <span className="text-[15px] text-gray-800" style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontStyle: 'italic' }}>The New York Times</span>
              </div>
            </div>

            {/* Card 2 - BBC */}
            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
              <p className="text-gray-700 text-[14px] leading-[1.75] font-normal text-center mb-6">
                &ldquo;Combines data and guidance in a way that feels clear and student-friendly.&rdquo;
              </p>
              <div className="border-t border-gray-100 pt-4 flex justify-center gap-1">
                {/* BBC Logo - Block style */}
                <div className="flex gap-0.5">
                  <span className="bg-black text-white text-[14px] font-bold px-1.5 py-0.5">B</span>
                  <span className="bg-black text-white text-[14px] font-bold px-1.5 py-0.5">B</span>
                  <span className="bg-black text-white text-[14px] font-bold px-1.5 py-0.5">C</span>
                </div>
              </div>
            </div>

            {/* Card 3 - TechCrunch */}
            <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)]" style={{ transform: 'rotate(1deg)' }}>
              <p className="text-gray-700 text-[14px] leading-[1.75] font-normal text-center mb-6">
                &ldquo;Helps students focus on fit, affordability, and outcomes — not just rankings.&rdquo;
              </p>
              <div className="border-t border-gray-100 pt-4 flex justify-center">
                {/* TechCrunch Logo */}
                <span className="text-[16px] font-bold text-green-600 tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>TC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Universities Section - Nomad List Style Grid */}
      <section id="universities" className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2">
                <div className="w-11 h-11 bg-white rounded-xl flex items-center justify-center shadow-sm p-2">
                  <img src="/logo.png" alt="StudyBuddy" className="w-full h-full object-contain" />
                </div>
              </Link>

              {/* Filters Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors border border-teal-200"
                >
                  {/* Lucide SlidersHorizontal icon */}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <line x1="21" y1="4" x2="14" y2="4" />
                    <line x1="10" y1="4" x2="3" y2="4" />
                    <line x1="21" y1="12" x2="12" y2="12" />
                    <line x1="8" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="20" x2="16" y2="20" />
                    <line x1="12" y1="20" x2="3" y2="20" />
                    <line x1="14" y1="2" x2="14" y2="6" />
                    <line x1="8" y1="10" x2="8" y2="14" />
                    <line x1="16" y1="18" x2="16" y2="22" />
                  </svg>
                  Filters
                  {selectedCountry !== 'All' && (
                    <span className="bg-teal-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">1</span>
                  )}
                </button>

                {/* Filter Dropdown */}
                {showFilters && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowFilters(false)} />
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-30 min-w-[200px]">
                    <p className="text-[12px] text-gray-500 uppercase tracking-wider mb-2">Country</p>
                    <div className="flex flex-wrap gap-2">
                      {COUNTRIES.map(country => (
                        <button
                          key={country}
                          onClick={() => {
                            setSelectedCountry(country)
                            setShowFilters(false)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                            selectedCountry === country
                              ? 'bg-teal-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  </div>
                  </>
                )}
              </div>

              {/* Search */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-56">
                {/* Lucide Search icon */}
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-none outline-none flex-1 text-gray-700 bg-transparent text-[14px]"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-[14px]">
                {/* Lucide LayoutGrid icon */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                Grid
              </button>

              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSortDropdown(!showSortDropdown)}
                  className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors text-[14px]"
                >
                  Sort: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
                  {/* Lucide ChevronDown icon */}
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {showSortDropdown && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setShowSortDropdown(false)} />
                    <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-30 min-w-[180px]">
                      {SORT_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setSortBy(option.value)
                            setShowSortDropdown(false)
                          }}
                          className={`w-full text-left px-4 py-2 text-[13px] hover:bg-gray-50 transition-colors ${
                            sortBy === option.value ? 'text-teal-600 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <Link
                href="/signup"
                className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg font-medium text-[14px] transition-all shadow-sm"
              >
                Join StudyBuddy →
              </Link>
            </div>
          </div>

          {/* Results count & Popular Label */}
          <p className="text-gray-500 text-[13px] mb-3">
            {searchQuery || selectedCountry !== 'All'
              ? `${filteredUniversities.length} universities found`
              : 'Popular'}
          </p>

          {/* University Cards Grid - Nomad List Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {loading ? (
              // Loading skeletons
              [...Array(12)].map((_, i) => (
                <div key={i} className="rounded-xl overflow-hidden bg-gray-200 animate-pulse" style={{ aspectRatio: '1/1.1' }} />
              ))
            ) : filteredUniversities.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500 text-[16px]">No universities found matching your criteria.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCountry('All'); }}
                  className="mt-4 text-teal-600 hover:text-teal-700 font-medium text-[14px]"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              filteredUniversities.map((university, index) => (
                <Link
                  href="/signup"
                  key={university.id}
                  className="relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 group"
                  style={{ aspectRatio: '1/1.1' }}
                >
                  {/* University Photo */}
                  <img
                    src={getUniversityImage(university)}
                    alt={university.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Default Gradient Overlay - stronger for text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40 group-hover:opacity-0 transition-opacity duration-300" />

                  {/* Top Left - Ranking Number Only */}
                  <div className="absolute top-3 left-3 flex flex-col group-hover:opacity-0 transition-opacity duration-300">
                    <span className="text-white font-bold text-[22px] drop-shadow-lg">{index + 1}</span>
                    <div className="w-6 h-[2px] bg-white/80 mt-0.5" />
                  </div>

                  {/* Default Content - University Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 group-hover:opacity-0 transition-opacity duration-300">
                    {/* Top row: Name and acceptance rate */}
                    <div className="flex items-end justify-between mb-1">
                      <div className="flex-1 pr-2">
                        <h3 className="text-[18px] font-semibold text-white leading-tight drop-shadow-lg">
                          {university.name.length > 28
                            ? university.name.split(' ').slice(0, 3).join(' ')
                            : university.name}
                        </h3>
                        <p className="text-white/90 text-[13px] drop-shadow">
                          {university.country}
                        </p>
                      </div>
                    </div>

                    {/* Bottom row: Acceptance rate left, Fees right */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        {/* Lucide GraduationCap icon */}
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10v6M2 10l10-5 10 5-10 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span className="text-white font-medium text-[13px] drop-shadow">{university.acceptance_rate || 'N/A'}%</span>
                      </div>
                      <div className="text-right">
                        <span className="text-white font-semibold text-[15px] drop-shadow">
                          {university.tuition_max ? formatCurrency(university.tuition_max) : 'N/A'}
                        </span>
                        <span className="text-white/70 text-[10px] ml-1">/ yr</span>
                      </div>
                    </div>
                  </div>

                  {/* HOVER STATE - Stats Overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.9))' }}>
                    {/* Top Row - Heart & Close */}
                    <div className="flex items-center justify-between p-3">
                      <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
                        </svg>
                      </button>
                      <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>

                    {/* Stats Bars - Nomad List Style with Lucide Icons */}
                    <div className="px-4 space-y-3">
                      {/* Overall - Star */}
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                        <span className="text-white text-[12px] font-medium" style={{ width: '55px' }}>Overall</span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: '#22c55e',
                            width: `${Math.max(30, Math.min(95, 100 - (university.ranking || 50) * 0.8))}%`
                          }} />
                        </div>
                      </div>

                      {/* Cost - DollarSign */}
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <line x1="12" y1="1" x2="12" y2="23" />
                          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                        </svg>
                        <span className="text-white text-[12px] font-medium" style={{ width: '55px' }}>Cost</span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: '#eab308',
                            width: `${Math.max(25, Math.min(90, 100 - (university.tuition_max || 30000) / 800))}%`
                          }} />
                        </div>
                      </div>

                      {/* Acceptance - BarChart */}
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <line x1="18" y1="20" x2="18" y2="10" />
                          <line x1="12" y1="20" x2="12" y2="4" />
                          <line x1="6" y1="20" x2="6" y2="14" />
                        </svg>
                        <span className="text-white text-[12px] font-medium" style={{ width: '55px' }}>Accept</span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: (university.acceptance_rate || 50) > 30 ? '#22c55e' : (university.acceptance_rate || 50) > 15 ? '#eab308' : '#ef4444',
                            width: `${Math.max(15, Math.min(university.acceptance_rate || 50, 100))}%`
                          }} />
                        </div>
                      </div>

                      {/* Liked - ThumbsUp */}
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                        </svg>
                        <span className="text-white text-[12px] font-medium" style={{ width: '55px' }}>Liked</span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: '#22c55e',
                            width: `${Math.max(40, Math.min(95, 100 - (university.ranking || 50)))}%`
                          }} />
                        </div>
                      </div>

                      {/* Quality - Trophy */}
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" />
                          <path d="M18 2H6v7a6 6 0 1012 0V2z" />
                        </svg>
                        <span className="text-white text-[12px] font-medium" style={{ width: '55px' }}>Quality</span>
                        <div style={{ flex: 1, height: '12px', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            borderRadius: '6px',
                            backgroundColor: '#22c55e',
                            width: `${Math.max(50, Math.min(95, 100 - (university.ranking || 50) * 0.6))}%`
                          }} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom - University Name */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-[16px] font-semibold text-white leading-tight">
                        {university.name.length > 28 ? university.name.split(' ').slice(0, 3).join(' ') : university.name}
                      </h3>
                      <p className="text-white/70 text-[12px]">{university.country}</p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Load More */}
          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-8 py-4 rounded-full font-medium text-[15px] transition-all"
            >
              View All 100+ Universities →
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-[32px] sm:text-[36px] font-semibold text-gray-900 mb-4 leading-[1.2]">
              Everything you need to succeed
            </h2>
            <p className="text-gray-600 text-[16px] leading-[1.6] max-w-2xl mx-auto">
              Our AI-powered platform guides you through every step of the study abroad process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/ai-counselor.png" alt="AI Counselor Chat" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">AI Counselor Chat</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                Get personalized advice through natural conversation with our AI that understands your goals.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-violet-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/university.png" alt="University Matching" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">University Matching</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                AI analyzes your profile to suggest Dream, Target, and Safe schools worldwide.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-teal-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-teal-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/application-tracking.jpg" alt="Application Tracking" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">Application Tracking</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                Stay organized with AI-generated tasks, deadlines, and progress tracking.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-orange-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/profile-analysis.png" alt="Profile Analysis" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">Profile Analysis</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                Understand your strengths and get recommendations to improve your profile.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-cyan-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-cyan-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/global-uni.png" alt="Global Universities" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">Global Universities</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                Explore 100+ universities across USA, UK, Canada, Australia, Germany, and more.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 hover:border-emerald-300 transition-all hover:shadow-lg group">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform p-2.5">
                <img src="/icons/insight.png" alt="Instant Insights" className="w-full h-full object-contain" />
              </div>
              <h3 className="text-[18px] font-semibold text-gray-900 mb-3">Instant Insights</h3>
              <p className="text-gray-600 text-[15px] leading-[1.6]">
                Get real-time feedback and insights on your application strategy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-emerald-500 to-green-600 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-[32px] sm:text-[40px] lg:text-[44px] font-semibold text-white mb-6 leading-[1.2]">
            Ready to find your perfect university?
          </h2>
          <p className="text-white/90 text-[16px] leading-[1.6] max-w-2xl mx-auto mb-8">
            Join thousands of students who have found their dream universities with StudyBuddy.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-white text-emerald-600 px-10 py-4 rounded-full font-medium text-[16px] hover:shadow-xl transition-all hover:scale-105"
            >
              Get Started for Free
            </Link>
            <button
              onClick={() => setShowVideo(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-8 py-4 rounded-full font-semibold text-lg transition-all border border-white/30"
            >
              <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center">
                {/* Lucide Play icon */}
                <svg className="w-4 h-4 text-white ml-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" stroke="none" />
                </svg>
              </div>
              Watch Video
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1.5">
                <img src="/logo.png" alt="StudyBuddy" className="w-full h-full object-contain" />
              </div>
              <span className="text-white font-semibold">StudyBuddy</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2026 StudyBuddy. Built for the AI Hackathon.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Bottom Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white py-3 px-4 z-40">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
            {/* Lucide Globe icon */}
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
            <span className="font-normal text-[14px]">Join a community of students finding their perfect universities</span>
            <Link
              href="/signup"
              className="bg-white text-emerald-600 px-4 py-1.5 rounded-full font-medium text-[13px] hover:bg-gray-100 transition-colors"
            >
              Join StudyBuddy
            </Link>
            <button
              onClick={() => setShowBanner(false)}
              className="text-white/80 hover:text-white ml-2"
            >
              {/* Lucide X icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideo && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideo(false)}
        >
          <div
            className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideo(false)}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <video
              autoPlay
              controls
              className="w-full h-full"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      )}
    </div>
  )
}
