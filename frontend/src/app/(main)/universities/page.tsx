'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { cn, formatCurrency } from '@/lib/utils'
import type { University, ShortlistedUniversity } from '@/types'

// Tab options
type TabType = 'curated' | 'search-all'

// External university from Hipo API
interface ExternalUniversity {
  id: null
  name: string
  country: string
  alpha_two_code?: string
  website?: string
  domains?: string[]
  state_province?: string
  is_external: true
}

const COUNTRIES = ['All', 'USA', 'UK', 'Canada', 'Australia', 'Germany', 'India', 'Singapore', 'Japan', 'South Korea', 'Switzerland', 'Netherlands']

const CATEGORY_CONFIG = {
  dream: { label: 'Dream', color: 'bg-violet-500', description: 'Reach for the stars' },
  target: { label: 'Target', color: 'bg-blue-500', description: 'Strong match for you' },
  safe: { label: 'Safe', color: 'bg-emerald-500', description: 'High chance of admission' },
}

// Local university images from /public/universities/
const UNIVERSITY_IMAGES: Record<string, string> = {
  // USA Universities
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
  'University of California, Los Angeles': '/universities/university of california los angeles.jpg',
  'UCLA': '/universities/university of california los angeles.jpg',
  'New York University': '/universities/new york university.jpeg',
  'University of Southern California': '/universities/university of southern california.jpg',
  'Boston University': '/universities/boston university.jpg',
  'Cornell University': '/universities/cornell university.jpg',
  'Rice University': '/universities/rice uni.jpg',
  'University of Texas at Austin': '/universities/university of texas at austin.jpg',
  'University of Florida': '/universities/university of florida.jpg',
  'University of Illinois Urbana-Champaign': '/universities/university of illinois.jpeg',
  'University of Wisconsin-Madison': '/universities/university of wisconsin–madison.jpg',
  'Ohio State University': '/universities/ohio state university.jpg',
  'Penn State University': '/universities/penn state university.jpeg',
  'Purdue University': '/universities/purdue university.jpeg',
  'University of Washington': '/universities/university of washington.jpg',
  'University of Maryland': '/universities/university of maryland.jpeg',
  'Virginia Tech': '/universities/virginia tech.jpeg',
  'Indiana University Bloomington': '/universities/indiana university bloomington.jpeg',
  'Arizona State University': '/universities/arizona state university.jpg',
  'University of Virginia': '/universities/uni of virginia.jpg',

  // UK Universities
  'University of Oxford': '/universities/oxfored uni.jpg',
  'University of Cambridge': '/universities/cambridge.jpg',
  'Imperial College London': '/universities/imperial london.jpg',
  'University College London': '/universities/ucl.jpg',
  'London School of Economics': '/universities/london school of economics.jpeg',
  'University of Edinburgh': '/universities/university of edinburgh.jpg',
  'Kings College London': '/universities/king college london.jpg',
  'University of Warwick': '/universities/university of warwick.jpg',
  'University of Bristol': '/universities/university of bristol.jpg',
  'University of Glasgow': '/universities/university of glasgow.jpg',
  'Durham University': '/universities/durham university.jpg',
  'University of Birmingham': '/universities/university of birmingham.jpg',
  'University of Leeds': '/universities/university of leeds.jpg',
  'University of Southampton': '/universities/university of southampton.jpg',

  // Canada Universities
  'University of Toronto': '/universities/university of toronto.jpg',
  'McGill University': '/universities/mcgill university.jpg',
  'University of British Columbia': '/universities/university of british columbia.jpg',
  'University of Waterloo': '/universities/university of waterloo.jpeg',
  'University of Alberta': '/universities/university of alberta.jpg',
  'McMaster University': '/universities/mcmaster university.jpg',
  'University of Montreal': '/universities/university of montreal.jpg',
  'Queens University': '/universities/queens university.jpeg',
  'Western University': '/universities/western university.jpg',
  'Simon Fraser University': '/universities/simon fraser university.jpg',
  'University of Calgary': '/universities/university of calgary.jpeg',
  'University of Ottawa': '/universities/university of ottawa.jpg',

  // Australia Universities
  'University of Melbourne': '/universities/university of melbourne.jpg',
  'University of Sydney': '/universities/uni of sydney .jpg',
  'Australian National University': '/universities/australian-national-university.jpeg',
  'University of Queensland': '/universities/university of queensland.jpg',
  'Monash University': '/universities/monash university.jpg',
  'UNSW Sydney': '/universities/university of new south wales.jpeg',
  'University of Western Australia': '/universities/university of western australia.jpg',
  'University of Adelaide': '/universities/university of adelaide.jpeg',
  'University of Technology Sydney': '/universities/university of technology sydney.jpg',
  'RMIT University': '/universities/rmit university.jpg',

  // Germany Universities
  'Technical University of Munich': '/universities/technical university of munich.jpg',
  'Ludwig Maximilian University': '/universities/ludwig maximilian university of munich.jpg',
  'Humboldt University Berlin': '/universities/humboldt university of berlin.jpg',
  'Free University of Berlin': '/universities/free university of berlin.jpg',
  'RWTH Aachen': '/universities/rwth aachen university.jpg',
  'Technical University of Berlin': '/universities/technical university of berlin.jpg',
  'University of Bonn': '/universities/university of bonn.jpeg',
  'University of Tübingen': '/universities/university of tübingen.jpg',

  // India Universities
  'Indian Institute of Technology Bombay': '/universities/iit bombay.jpeg',
  'Indian Institute of Technology Delhi': '/universities/iit delhi.jpg',
  'Indian Institute of Science': '/universities/iisc.jpg',
  'Indian Institute of Technology Madras': '/universities/iit madras.jpg',
  'Indian Institute of Technology Kanpur': '/universities/iit kanpur.jpg',
  'Indian Institute of Technology Kharagpur': '/universities/iit kharagpur.jpg',
  'Indian Institute of Technology Roorkee': '/universities/iit roorkee.jpg',
  'Indian Institute of Technology Guwahati': '/universities/iit guwahati.jpg',
  'University of Delhi': '/universities/delhi university.jpg',
  'Jawaharlal Nehru University': '/universities/jnu.jpg',
  'Indian Institute of Management Ahmedabad': '/universities/iim ahmedabad.jpg',
  'Indian Institute of Management Bangalore': '/universities/iim bangalore.jpg',
  'BITS Pilani': '/universities/bits pilani.jpg',
  'Manipal Academy of Higher Education': '/universities/manipal university.jpg',
  'VIT Vellore': '/universities/vit vellore.jpg',
  'SRM University': '/universities/SRM Univ.jpg',
  'Amity University Noida': '/universities/amity noida.jpg',
  'Lovely Professional University': '/universities/lovely professional university.jpeg',

  // Additional mappings for alternative names (matching actual DB names)
  'Delhi University': '/universities/delhi university.jpg',
  'Vellore Institute of Technology': '/universities/vit vellore.jpg',
  'SRM Institute of Science and Technology': '/universities/SRM Univ.jpg',
  'Amity University': '/universities/amity noida.jpg',
  'University of California, Berkeley': '/universities/university of california berkeley.jpg',
  'IIT Bombay': '/universities/iit bombay.jpeg',
  'IIT Delhi': '/universities/iit delhi.jpg',
  'IIT Madras': '/universities/iit madras.jpg',
  'IIT Kanpur': '/universities/iit kanpur.jpg',
  'IIT Kharagpur': '/universities/iit kharagpur.jpg',
  'IIT Roorkee': '/universities/iit roorkee.jpg',
  'IIT Guwahati': '/universities/iit guwahati.jpg',
  'IISc': '/universities/iisc.jpg',
  'IISc Bangalore': '/universities/iisc.jpg',
  'IIM Ahmedabad': '/universities/iim ahmedabad.jpg',
  'IIM Bangalore': '/universities/iim bangalore.jpg',
  'JNU': '/universities/jnu.jpg',
  'UCL': '/universities/ucl.jpg',
  'LSE': '/universities/london school of economics.jpeg',
  'London School of Economics and Political Science': '/universities/london school of economics.jpeg',
  'Oxford': '/universities/oxfored uni.jpg',
  'Cambridge': '/universities/cambridge.jpg',
  'MIT': '/universities/mit.jpeg',
  'Caltech': '/universities/caltech .jpg',
  "King's College London": '/universities/king college london.jpg',
  'Georgia Tech': '/universities/georgia institute of technology.jpeg',
  'Penn': '/universities/university of pennsylvania.jpg',
  'UPenn': '/universities/university of pennsylvania.jpg',
  'UC Berkeley': '/universities/university of california berkeley.jpg',
  'Berkeley': '/universities/university of california berkeley.jpg',
  'UBC': '/universities/university of british columbia.jpg',
  'McGill': '/universities/mcgill university.jpg',
  'UofT': '/universities/university of toronto.jpg',
  'UToronto': '/universities/university of toronto.jpg',
  'UNSW': '/universities/university of new south wales.jpeg',
  'ANU': '/universities/australian-national-university.jpeg',
  'UMelbourne': '/universities/university of melbourne.jpg',
  'USyd': '/universities/uni of sydney .jpg',
  'TUM': '/universities/technical university of munich.jpg',
  'LMU': '/universities/ludwig maximilian university of munich.jpg',
  'LMU Munich': '/universities/ludwig maximilian university of munich.jpg',
  'Ludwig Maximilian University of Munich': '/universities/ludwig maximilian university of munich.jpg',
  'Humboldt University of Berlin': '/universities/humboldt university of berlin.jpg',
  'RWTH Aachen University': '/universities/rwth aachen university.jpg',
  "Queen's University": '/universities/queens university.jpeg',
}

// Country background images (fallback when university image not found) for cards without specific images
const COUNTRY_BACKGROUNDS: Record<string, string> = {
  'USA': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&h=600&fit=crop',
  'United States': 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=800&h=600&fit=crop',
  'UK': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'United Kingdom': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=600&fit=crop',
  'Canada': 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=600&fit=crop',
  'Australia': 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?w=800&h=600&fit=crop',
  'Germany': 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=600&fit=crop',
  'India': 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800&h=600&fit=crop',
  'Singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
  'Japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=600&fit=crop',
  'South Korea': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&h=600&fit=crop',
  'Switzerland': 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?w=800&h=600&fit=crop',
  'Netherlands': 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=600&fit=crop',
  'Sweden': 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=800&h=600&fit=crop',
  'France': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
  'Italy': 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b?w=800&h=600&fit=crop',
  'Spain': 'https://images.unsplash.com/photo-1543783207-ec64e4d95325?w=800&h=600&fit=crop',
  'China': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=800&h=600&fit=crop',
  'Brazil': 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop',
  'Mexico': 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=800&h=600&fit=crop',
  'New Zealand': 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?w=800&h=600&fit=crop',
  'Ireland': 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?w=800&h=600&fit=crop',
  'Norway': 'https://images.unsplash.com/photo-1520769945061-0a448c463865?w=800&h=600&fit=crop',
  'Denmark': 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=600&fit=crop',
  'Finland': 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=800&h=600&fit=crop',
  'Austria': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=600&fit=crop',
  'Belgium': 'https://images.unsplash.com/photo-1559113513-d5e09c78b9dd?w=800&h=600&fit=crop',
  'Poland': 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=800&h=600&fit=crop',
  'Russia': 'https://images.unsplash.com/photo-1513326738677-b964603b136d?w=800&h=600&fit=crop',
  'Turkey': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=600&fit=crop',
  'Malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&h=600&fit=crop',
  'Thailand': 'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop',
  'Indonesia': 'https://images.unsplash.com/photo-1555899434-94d1368aa7af?w=800&h=600&fit=crop',
  'Philippines': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?w=800&h=600&fit=crop',
  'Vietnam': 'https://images.unsplash.com/photo-1557750255-c76072a7aad1?w=800&h=600&fit=crop',
  'South Africa': 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=800&h=600&fit=crop',
  'Egypt': 'https://images.unsplash.com/photo-1539768942893-daf53e448371?w=800&h=600&fit=crop',
  'United Arab Emirates': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop',
  'Saudi Arabia': 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=800&h=600&fit=crop',
  'Israel': 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&h=600&fit=crop',
  'Argentina': 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=800&h=600&fit=crop',
  'Chile': 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=800&h=600&fit=crop',
  'Colombia': 'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?w=800&h=600&fit=crop',
  'Peru': 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=600&fit=crop',
  'Portugal': 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=800&h=600&fit=crop',
  'Greece': 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=800&h=600&fit=crop',
  'Czech Republic': 'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=600&fit=crop',
  'Hungary': 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&h=600&fit=crop',
  'Romania': 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?w=800&h=600&fit=crop',
  'Pakistan': 'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=800&h=600&fit=crop',
  'Bangladesh': 'https://images.unsplash.com/photo-1617634000143-87dc4d746fd8?w=800&h=600&fit=crop',
  'Sri Lanka': 'https://images.unsplash.com/photo-1586613835341-21daee8ba01e?w=800&h=600&fit=crop',
  'Nepal': 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&h=600&fit=crop',
  'Hong Kong': 'https://images.unsplash.com/photo-1536599018102-9f803c979e65?w=800&h=600&fit=crop',
  'Taiwan': 'https://images.unsplash.com/photo-1470004914212-05527e49370b?w=800&h=600&fit=crop',
}

// Helper to get country background with fallback
const getCountryBackground = (country: string): string => {
  return COUNTRY_BACKGROUNDS[country] || 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop'
}

// Helper to get flag emoji from country name or alpha code
const getCountryFlag = (country: string, alphaCode?: string): string => {
  const flagMap: Record<string, string> = {
    'US': '🇺🇸', 'USA': '🇺🇸', 'United States': '🇺🇸',
    'GB': '🇬🇧', 'UK': '🇬🇧', 'United Kingdom': '🇬🇧',
    'CA': '🇨🇦', 'Canada': '🇨🇦',
    'AU': '🇦🇺', 'Australia': '🇦🇺',
    'DE': '🇩🇪', 'Germany': '🇩🇪',
    'IN': '🇮🇳', 'India': '🇮🇳',
    'JP': '🇯🇵', 'Japan': '🇯🇵',
    'SG': '🇸🇬', 'Singapore': '🇸🇬',
    'FR': '🇫🇷', 'France': '🇫🇷',
    'NL': '🇳🇱', 'Netherlands': '🇳🇱',
    'CH': '🇨🇭', 'Switzerland': '🇨🇭',
    'KR': '🇰🇷', 'South Korea': '🇰🇷',
    'CN': '🇨🇳', 'China': '🇨🇳',
    'IT': '🇮🇹', 'Italy': '🇮🇹',
    'ES': '🇪🇸', 'Spain': '🇪🇸',
    'BR': '🇧🇷', 'Brazil': '🇧🇷',
    'MX': '🇲🇽', 'Mexico': '🇲🇽',
    'NZ': '🇳🇿', 'New Zealand': '🇳🇿',
    'IE': '🇮🇪', 'Ireland': '🇮🇪',
    'SE': '🇸🇪', 'Sweden': '🇸🇪',
    'NO': '🇳🇴', 'Norway': '🇳🇴',
    'DK': '🇩🇰', 'Denmark': '🇩🇰',
    'FI': '🇫🇮', 'Finland': '🇫🇮',
    'AT': '🇦🇹', 'Austria': '🇦🇹',
    'BE': '🇧🇪', 'Belgium': '🇧🇪',
    'PL': '🇵🇱', 'Poland': '🇵🇱',
    'RU': '🇷🇺', 'Russia': '🇷🇺',
    'TR': '🇹🇷', 'Turkey': '🇹🇷',
    'MY': '🇲🇾', 'Malaysia': '🇲🇾',
    'TH': '🇹🇭', 'Thailand': '🇹🇭',
    'ID': '🇮🇩', 'Indonesia': '🇮🇩',
    'PH': '🇵🇭', 'Philippines': '🇵🇭',
    'VN': '🇻🇳', 'Vietnam': '🇻🇳',
    'ZA': '🇿🇦', 'South Africa': '🇿🇦',
    'EG': '🇪🇬', 'Egypt': '🇪🇬',
    'AE': '🇦🇪', 'United Arab Emirates': '🇦🇪',
    'SA': '🇸🇦', 'Saudi Arabia': '🇸🇦',
    'IL': '🇮🇱', 'Israel': '🇮🇱',
    'AR': '🇦🇷', 'Argentina': '🇦🇷',
    'CL': '🇨🇱', 'Chile': '🇨🇱',
    'CO': '🇨🇴', 'Colombia': '🇨🇴',
    'PE': '🇵🇪', 'Peru': '🇵🇪',
    'PT': '🇵🇹', 'Portugal': '🇵🇹',
    'GR': '🇬🇷', 'Greece': '🇬🇷',
    'CZ': '🇨🇿', 'Czech Republic': '🇨🇿',
    'HU': '🇭🇺', 'Hungary': '🇭🇺',
    'RO': '🇷🇴', 'Romania': '🇷🇴',
    'PK': '🇵🇰', 'Pakistan': '🇵🇰',
    'BD': '🇧🇩', 'Bangladesh': '🇧🇩',
    'LK': '🇱🇰', 'Sri Lanka': '🇱🇰',
    'NP': '🇳🇵', 'Nepal': '🇳🇵',
    'HK': '🇭🇰', 'Hong Kong': '🇭🇰',
    'TW': '🇹🇼', 'Taiwan': '🇹🇼',
  }
  if (alphaCode && flagMap[alphaCode]) return flagMap[alphaCode]
  if (flagMap[country]) return flagMap[country]
  return '🎓'
}

// Lucide SVG Icons
const Icons = {
  heart: (filled: boolean) => (
    <svg className="w-5 h-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8"/>
      <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  location: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0Z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  lock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0110 0v4"/>
    </svg>
  ),
  star: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  graduation: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      {/* Location pin outline */}
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
      {/* Inner circle */}
      <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
      {/* Graduation cap inside */}
      <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5v1.5c0 .5 1.1 1 2.5 1s2.5-.5 2.5-1V9.5"/>
    </svg>
  ),
  grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <line x1="21" y1="4" x2="14" y2="4"/>
      <line x1="10" y1="4" x2="3" y2="4"/>
      <line x1="21" y1="12" x2="12" y2="12"/>
      <line x1="8" y1="12" x2="3" y2="12"/>
      <line x1="21" y1="20" x2="16" y2="20"/>
      <line x1="12" y1="20" x2="3" y2="20"/>
      <line x1="14" y1="2" x2="14" y2="6"/>
      <line x1="8" y1="10" x2="8" y2="14"/>
      <line x1="16" y1="18" x2="16" y2="22"/>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
    </svg>
  ),
}

// Progress bar component
const ProgressBar = ({ value, label, color }: { value: number; label: string; color: string }) => {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">{Math.round(value)}%</span>
      </div>
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", color)}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  )
}

export default function UniversitiesPage() {
  const [loading, setLoading] = useState(true)
  const [universities, setUniversities] = useState<University[]>([])
  const [shortlist, setShortlist] = useState<ShortlistedUniversity[]>([])
  const [selectedCountry, setSelectedCountry] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showShortlistOnly, setShowShortlistOnly] = useState(false)
  const [selectedUni, setSelectedUni] = useState<University | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('curated')

  // External search state
  const [externalSearchQuery, setExternalSearchQuery] = useState('')
  const [externalCountry, setExternalCountry] = useState('')
  const [externalResults, setExternalResults] = useState<ExternalUniversity[]>([])
  const [searchingExternal, setSearchingExternal] = useState(false)
  const [selectedExternalUni, setSelectedExternalUni] = useState<ExternalUniversity | null>(null)
  const [shortlistingExternal, setShortlistingExternal] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    // Only load curated universities (is_external = false or null)
    const { data: uniData } = await supabase
      .from('universities')
      .select('*')
      .or('is_external.is.null,is_external.eq.false')
      .order('ranking', { ascending: true })

    if (uniData) setUniversities(uniData)

    const { data: shortlistData } = await supabase
      .from('shortlisted_universities')
      .select('*, university:universities(*)')
      .eq('user_id', user.id)

    if (shortlistData) setShortlist(shortlistData)

    setLoading(false)
  }

  const handleShortlist = async (university: University, category: 'dream' | 'target' | 'safe') => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    const existing = shortlist.find((s) => s.university_id === university.id)

    if (existing) {
      setShortlist(shortlist.map((s) =>
        s.id === existing.id ? { ...s, category } : s
      ))
      await supabase
        .from('shortlisted_universities')
        .update({ category })
        .eq('id', existing.id)
    } else {
      const tempItem: ShortlistedUniversity = {
        id: `temp-${Date.now()}`,
        user_id: user.id,
        university_id: university.id,
        university,
        category,
        is_locked: false,
        created_at: new Date().toISOString(),
      }
      setShortlist([...shortlist, tempItem])

      const { data } = await supabase
        .from('shortlisted_universities')
        .insert({
          user_id: user.id,
          university_id: university.id,
          category,
        })
        .select('*, university:universities(*)')
        .single()

      if (data) {
        setShortlist((prev) => prev.map((s) =>
          s.id === tempItem.id ? data : s
        ))
      }
    }
  }

  const handleRemoveFromShortlist = async (universityId: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setShortlist(shortlist.filter((s) => s.university_id !== universityId))

    await supabase
      .from('shortlisted_universities')
      .delete()
      .eq('user_id', user.id)
      .eq('university_id', universityId)
  }

  const handleLock = async (shortlistItem: ShortlistedUniversity) => {
    if (!confirm(`Lock ${shortlistItem.university.name}? This means you're committing to apply here!`)) {
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return

    setShortlist(shortlist.map((s) =>
      s.id === shortlistItem.id ? { ...s, is_locked: true } : s
    ))

    await supabase
      .from('shortlisted_universities')
      .update({ is_locked: true })
      .eq('id', shortlistItem.id)

    await supabase
      .from('profiles')
      .update({ current_stage: 4 })
      .eq('id', user.id)
  }

  // External university search
  const searchExternalUniversities = async () => {
    if (!externalSearchQuery && !externalCountry) return

    setSearchingExternal(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const params: { name?: string; country?: string; limit?: number } = { limit: 30 }
      if (externalSearchQuery) params.name = externalSearchQuery
      if (externalCountry) params.country = externalCountry

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/universities/search-external?${new URLSearchParams(params as Record<string, string>)}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      )

      if (response.ok) {
        const data = await response.json()
        setExternalResults(data)
      }
    } catch (error) {
      console.error('Error searching external universities:', error)
    } finally {
      setSearchingExternal(false)
    }
  }

  // Shortlist external university
  const handleShortlistExternal = async (uni: ExternalUniversity, category: 'dream' | 'target' | 'safe') => {
    setShortlistingExternal(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/universities/shortlist-external`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            name: uni.name,
            country: uni.country,
            category,
            website: uni.website,
          }),
        }
      )

      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setShortlist((prev) => [...prev, result.data])
        }
        setSelectedExternalUni(null)
        // Reload data to get updated university list
        loadData()
      }
    } catch (error) {
      console.error('Error shortlisting external university:', error)
    } finally {
      setShortlistingExternal(false)
    }
  }

  // Check if external university is already shortlisted
  const isExternalShortlisted = (uniName: string, uniCountry: string) => {
    return shortlist.some(
      (s) => s.university.name === uniName && s.university.country === uniCountry
    )
  }

  const filteredUniversities = universities.filter((uni) => {
    const matchesCountry = selectedCountry === 'All' || uni.country === selectedCountry
    const matchesSearch = uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      uni.city?.toLowerCase().includes(searchQuery.toLowerCase())

    if (showShortlistOnly) {
      return shortlist.some((s) => s.university_id === uni.id) && matchesCountry && matchesSearch
    }

    return matchesCountry && matchesSearch
  })

  const getShortlistItem = (universityId: string) => {
    return shortlist.find((s) => s.university_id === universityId)
  }

  const isShortlisted = (universityId: string) => {
    return shortlist.some((s) => s.university_id === universityId)
  }

  const lockedCount = shortlist.filter((s) => s.is_locked).length

  // Calculate scores for progress bars
  const getAcceptanceScore = (rate?: number | null) => {
    if (!rate) return 50
    return Math.min(rate, 100)
  }

  const getTuitionScore = (tuition?: number | null) => {
    if (!tuition) return 50
    return Math.max(0, 100 - (tuition / 700))
  }

  const getRankingScore = (ranking?: number | null) => {
    if (!ranking) return 50
    return Math.max(0, 100 - (ranking / 5))
  }

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-emerald-500'
    if (score >= 40) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getUniversityImage = (university: University) => {
    return UNIVERSITY_IMAGES[university.name] || null
  }

  const getBackgroundImage = (university: University) => {
    return COUNTRY_BACKGROUNDS[university.country] || COUNTRY_BACKGROUNDS['USA']
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen bg-gray-50 dark:bg-[#0f1419]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center animate-pulse shadow-lg">
            <div className="text-white">{Icons.graduation}</div>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading universities...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f1419]">
      {/* Header Bar */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f1419]/90 backdrop-blur-lg border-b border-gray-200 dark:border-white/10">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl flex items-center justify-center text-white shadow-lg">
                {Icons.graduation}
              </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex bg-gray-100 dark:bg-white/10 rounded-full p-1">
              <button
                onClick={() => setActiveTab('curated')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === 'curated'
                    ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="hidden sm:inline">AI Curated</span>
                <span className="sm:hidden">AI</span>
                <span className="bg-emerald-100 dark:bg-emerald-500/30 text-emerald-600 dark:text-emerald-300 text-xs px-1.5 py-0.5 rounded-full">{universities.length}</span>
              </button>
              <button
                onClick={() => setActiveTab('search-all')}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === 'search-all'
                    ? "bg-white dark:bg-emerald-500 text-emerald-600 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                )}
              >
                {Icons.globe}
                <span className="hidden sm:inline">Search All</span>
                <span className="sm:hidden">All</span>
              </button>
            </div>

            {/* Filters Button - Only show for curated tab */}
            {activeTab === 'curated' && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full font-medium transition-all",
                  showFilters
                    ? "bg-emerald-500 text-white"
                    : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200"
                )}
              >
                {Icons.filter}
                Filters
              </button>
            )}

            {/* Search - Different for each tab */}
            {activeTab === 'curated' ? (
              <div className="flex-1 max-w-md relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {Icons.search}
                </div>
                <input
                  type="text"
                  placeholder="Search curated universities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-full bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-emerald-400 focus:outline-none transition-colors"
                />
              </div>
            ) : (
              <div className="flex-1 flex gap-2 max-w-2xl">
                <div className="flex-1 relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    {Icons.search}
                  </div>
                  <input
                    type="text"
                    placeholder="Search university name..."
                    value={externalSearchQuery}
                    onChange={(e) => setExternalSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchExternalUniversities()}
                    className="w-full pl-12 pr-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-full bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-emerald-400 focus:outline-none transition-colors"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Country (optional)"
                  value={externalCountry}
                  onChange={(e) => setExternalCountry(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchExternalUniversities()}
                  className="w-44 px-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-full bg-white dark:bg-white/5 text-gray-900 dark:text-white focus:border-emerald-400 focus:outline-none transition-colors"
                />
                <button
                  onClick={searchExternalUniversities}
                  disabled={searchingExternal || (!externalSearchQuery && !externalCountry)}
                  className="px-6 py-2.5 bg-emerald-500 text-white rounded-full font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {searchingExternal ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    Icons.search
                  )}
                  <span className="hidden sm:inline">Search</span>
                </button>
              </div>
            )}

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4 ml-auto">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-yellow-500">{Icons.star}</span>
                <span className="font-bold text-gray-900 dark:text-white">{shortlist.length}</span>
                <span className="text-gray-500">shortlisted</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500">{Icons.lock}</span>
                <span className="font-bold text-gray-900 dark:text-white">{lockedCount}</span>
                <span className="text-gray-500">locked</span>
              </div>
            </div>

            {/* View Toggle */}
            <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 dark:border-white/10 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
              {Icons.grid}
              <span className="hidden sm:inline">Grid view</span>
            </button>
          </div>

          {/* Country Filters */}
          {/* Country Filters - Only show for curated tab */}
          {activeTab === 'curated' && showFilters && (
            <div className="flex gap-2 flex-wrap mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
              {COUNTRIES.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-medium transition-all',
                    selectedCountry === country
                      ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                  )}
                >
                  {country}
                </button>
              ))}
              <button
                onClick={() => setShowShortlistOnly(!showShortlistOnly)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                  showShortlistOnly
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                )}
              >
                {Icons.heart(showShortlistOnly)}
                Shortlisted
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area - Grid with Sidebar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Left Side - Content based on tab */}
          <div className="flex-1 min-w-0">

            {/* SEARCH ALL TAB - External Universities */}
            {activeTab === 'search-all' && (
              <div>
                {/* Search prompt */}
                {externalResults.length === 0 && !searchingExternal && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <div className="text-emerald-500 w-10 h-10">{Icons.globe}</div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Search 10,000+ Universities Worldwide</h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      Enter a university name or country above to search our global database.
                      You can shortlist any university you find!
                    </p>
                  </div>
                )}

                {/* Search Results */}
                {externalResults.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Found <span className="font-bold text-gray-900 dark:text-white">{externalResults.length}</span> universities
                      </p>
                      <button
                        onClick={() => setExternalResults([])}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        Clear results
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                      {externalResults.map((uni, index) => {
                        const alreadyShortlisted = isExternalShortlisted(uni.name, uni.country)
                        const countryBg = getCountryBackground(uni.country)
                        const flag = getCountryFlag(uni.country, uni.alpha_two_code)
                        return (
                          <div
                            key={`${uni.name}-${uni.country}-${index}`}
                            onClick={() => !alreadyShortlisted && setSelectedExternalUni(uni)}
                            className={cn(
                              "relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] hover:shadow-2xl",
                              alreadyShortlisted && "ring-4 ring-emerald-500"
                            )}
                            style={{ aspectRatio: '1/1.2' }}
                          >
                            {/* Background Image */}
                            <img
                              src={countryBg}
                              alt={uni.country}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />

                            {/* External Badge */}
                            <div className="absolute top-4 left-4 px-3 py-1.5 bg-blue-500/90 backdrop-blur-sm rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                              {Icons.globe}
                              Global Database
                            </div>

                            {/* Flag Badge */}
                            <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-xl">
                              {flag}
                            </div>

                            {/* Shortlisted Badge */}
                            {alreadyShortlisted && (
                              <div className="absolute top-16 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                                {Icons.heart(true)}
                                Shortlisted
                              </div>
                            )}

                            {/* Content */}
                            <div className="absolute bottom-0 left-0 right-0 p-5">
                              {/* University Name */}
                              <h3 className="text-xl font-bold text-white leading-tight line-clamp-2 drop-shadow-lg mb-2">
                                {uni.name}
                              </h3>

                              {/* Location */}
                              <p className="text-white/80 text-sm flex items-center gap-1.5 mb-3">
                                {Icons.location}
                                {uni.state_province ? `${uni.state_province}, ` : ''}{uni.country}
                              </p>

                              {/* Bottom Row */}
                              <div className="flex items-center justify-between">
                                {/* Website Link */}
                                {uni.website ? (
                                  <a
                                    href={uni.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 hover:text-emerald-300 transition-colors"
                                  >
                                    {Icons.globe}
                                    Visit website
                                  </a>
                                ) : (
                                  <span className="text-gray-400 text-sm">No website available</span>
                                )}

                                {/* Add Button */}
                                {!alreadyShortlisted && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedExternalUni(uni)
                                    }}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-lg"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                    </svg>
                                    Shortlist
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Hover Overlay with more info */}
                            <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-6">
                              <div className="text-4xl mb-3">{flag}</div>
                              <h3 className="text-lg font-bold text-white text-center leading-tight mb-2">
                                {uni.name}
                              </h3>
                              <p className="text-gray-300 text-sm text-center mb-4">
                                {uni.state_province ? `${uni.state_province}, ` : ''}{uni.country}
                              </p>

                              {/* Info badges */}
                              <div className="flex flex-wrap gap-2 justify-center mb-4">
                                <span className="px-3 py-1 bg-blue-500/30 text-blue-300 rounded-full text-xs font-medium">
                                  Global University
                                </span>
                                {uni.domains && uni.domains[0] && (
                                  <span className="px-3 py-1 bg-gray-500/30 text-gray-300 rounded-full text-xs font-medium">
                                    {uni.domains[0]}
                                  </span>
                                )}
                              </div>

                              {!alreadyShortlisted && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedExternalUni(uni)
                                  }}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-colors"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                  </svg>
                                  Add to Shortlist
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Loading state */}
                {searchingExternal && (
                  <div className="text-center py-20">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Searching universities worldwide...</p>
                  </div>
                )}
              </div>
            )}

            {/* AI CURATED TAB - Original Grid */}
            {activeTab === 'curated' && (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredUniversities.map((university, index) => {
            const shortlistItem = getShortlistItem(university.id)
            const isLocked = shortlistItem?.is_locked
            // Use university image directly, fallback to country background
            const uniImage = getUniversityImage(university) || getBackgroundImage(university)

            return (
              <div
                key={university.id}
                onClick={() => setSelectedUni(university)}
                className={cn(
                  "relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group hover:scale-[1.02] hover:shadow-2xl",
                  isLocked && "ring-4 ring-emerald-500"
                )}
                style={{ aspectRatio: '1/1.2' }}
              >
                {/* Loading Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 animate-pulse" />

                {/* University Photo */}
                <img
                  src={uniImage}
                  alt={university.name}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    // Fallback to country image if university image fails
                    const target = e.target as HTMLImageElement
                    if (!target.src.includes('unsplash')) {
                      target.src = getBackgroundImage(university)
                    }
                  }}
                />

                {/* Default Gradient Overlay - fades on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 transition-opacity duration-300 group-hover:opacity-0" />

                {/* HOVER STATE - Stats Overlay (Nomad List Style) */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0.9))' }}>
                  {/* Top Row - Heart & Close */}
                  <div className="flex items-center justify-between p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (isShortlisted(university.id)) {
                          const item = getShortlistItem(university.id)
                          if (!item?.is_locked) handleRemoveFromShortlist(university.id)
                        } else {
                          handleShortlist(university, 'target')
                        }
                      }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        isShortlisted(university.id)
                          ? "bg-emerald-500 text-white"
                          : "bg-white/20 hover:bg-white/30 text-white"
                      )}
                    >
                      {Icons.heart(isShortlisted(university.id))}
                    </button>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  {/* Stats Bars - Nomad List Style with Lucide Icons */}
                  <div className="px-5 space-y-4 flex-1 flex flex-col justify-center">
                    {/* Overall - Star */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      <span className="text-white text-[14px] font-medium w-[60px]">Overall</span>
                      <div className="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{
                          width: `${Math.max(30, Math.min(95, 100 - (university.ranking || 50) * 0.8))}%`
                        }} />
                      </div>
                    </div>

                    {/* Cost - DollarSign */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                      </svg>
                      <span className="text-white text-[14px] font-medium w-[60px]">Cost</span>
                      <div className="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-yellow-500" style={{
                          width: `${Math.max(25, Math.min(90, 100 - (university.tuition_max || 30000) / 800))}%`
                        }} />
                      </div>
                    </div>

                    {/* Acceptance - BarChart */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <line x1="18" y1="20" x2="18" y2="10" />
                        <line x1="12" y1="20" x2="12" y2="4" />
                        <line x1="6" y1="20" x2="6" y2="14" />
                      </svg>
                      <span className="text-white text-[14px] font-medium w-[60px]">Accept</span>
                      <div className="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
                        <div className={cn(
                          "h-full rounded-full",
                          (university.acceptance_rate || 50) > 30 ? 'bg-emerald-500' : (university.acceptance_rate || 50) > 15 ? 'bg-yellow-500' : 'bg-red-500'
                        )} style={{
                          width: `${Math.max(15, Math.min(university.acceptance_rate || 50, 100))}%`
                        }} />
                      </div>
                    </div>

                    {/* Liked - ThumbsUp */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
                      </svg>
                      <span className="text-white text-[14px] font-medium w-[60px]">Liked</span>
                      <div className="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{
                          width: `${Math.max(40, Math.min(95, 100 - (university.ranking || 50)))}%`
                        }} />
                      </div>
                    </div>

                    {/* Quality - Trophy */}
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-white/80 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34" />
                        <path d="M18 2H6v7a6 6 0 1012 0V2z" />
                      </svg>
                      <span className="text-white text-[14px] font-medium w-[60px]">Quality</span>
                      <div className="flex-1 h-3 bg-white/15 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{
                          width: `${Math.max(50, Math.min(95, 100 - (university.ranking || 50) * 0.6))}%`
                        }} />
                      </div>
                    </div>
                  </div>

                  {/* Bottom - University Name on hover */}
                  <div className="p-5 pt-0">
                    <h3 className="text-[18px] font-bold text-white leading-tight line-clamp-2">
                      {university.name}
                    </h3>
                    <p className="text-white/70 text-[14px] flex items-center gap-1 mt-1">
                      {Icons.location}
                      {university.city ? `${university.city}, ` : ''}{university.country}
                    </p>
                  </div>
                </div>

                {/* Ranking Badge */}
                <div className="absolute top-5 left-5 flex flex-col group-hover:opacity-0 transition-opacity duration-300">
                  <span className="text-white font-bold text-[28px] drop-shadow-lg">#{university.ranking || index + 1}</span>
                  <div className="w-8 h-[3px] bg-white/80 mt-1" />
                </div>

                {/* Shortlist Heart - only show when shortlisted, hidden on hover */}
                {isShortlisted(university.id) && (
                  <div className={cn(
                    "absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center z-10 bg-emerald-500 text-white group-hover:opacity-0 transition-opacity duration-300"
                  )}>
                    {Icons.heart(true)}
                  </div>
                )}

                {/* Category Badge - hidden on hover */}
                {shortlistItem && (
                  <div className={cn(
                    "absolute top-[70px] right-5 px-3 py-1.5 rounded-full text-sm font-bold text-white z-10 group-hover:opacity-0 transition-opacity duration-300",
                    CATEGORY_CONFIG[shortlistItem.category as keyof typeof CATEGORY_CONFIG]?.color
                  )}>
                    {CATEGORY_CONFIG[shortlistItem.category as keyof typeof CATEGORY_CONFIG]?.label}
                  </div>
                )}

                {/* Lock Badge */}
                {isLocked && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5 z-10">
                    {Icons.lock} Locked
                  </div>
                )}

                {/* Default Content - University Info (visible by default, hidden on hover) */}
                <div className="absolute bottom-0 left-0 right-0 p-5 group-hover:opacity-0 transition-opacity duration-300">
                  {/* Name and Country */}
                  <div className="mb-3">
                    <h3 className="text-[22px] font-bold text-white leading-tight drop-shadow-lg line-clamp-2">
                      {university.name}
                    </h3>
                    <p className="text-white/90 text-[14px] drop-shadow mt-1">
                      {university.country}
                    </p>
                  </div>

                  {/* Bottom row: Acceptance rate left, Fees right */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Graduation Cap icon */}
                      <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12v5c3 3 9 3 12 0v-5" />
                      </svg>
                      <span className="text-white font-semibold text-[15px] drop-shadow">{university.acceptance_rate || 'N/A'}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-bold text-[17px] drop-shadow">
                        {university.tuition_max ? formatCurrency(university.tuition_max) : 'N/A'}
                      </span>
                      <span className="text-white/70 text-[12px] ml-1">/ yr</span>
                    </div>
                  </div>
                </div>

              </div>
            )
          })}
            </div>

            {filteredUniversities.length === 0 && (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="text-gray-400 w-10 h-10">{Icons.search}</div>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">No universities found matching your criteria.</p>
                <p className="text-gray-500 mt-2">Try adjusting your filters!</p>
              </div>
            )}
            </>
            )}
          </div>

          {/* Right Sidebar - Student Examples */}
          <div className="hidden lg:block w-[320px] flex-shrink-0">
            <div className="space-y-5">
              {/* Studying Now Section */}
              <div className="bg-white dark:bg-white/[0.06] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
                    <circle cx="12" cy="10" r="4" strokeLinecap="round" strokeLinejoin="round"/>
                    <path fill="currentColor" d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
                  </svg>
                  <h3 className="font-bold text-gray-900 dark:text-white">Studying now</h3>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">(247)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {/* Student Avatars */}
                  {[
                    { name: 'Priya S.', country: '🇮🇳', school: 'MIT', img: 'https://randomuser.me/api/portraits/women/44.jpg' },
                    { name: 'Arjun K.', country: '🇮🇳', school: 'Stanford', img: 'https://randomuser.me/api/portraits/men/32.jpg' },
                    { name: 'Sarah L.', country: '🇬🇧', school: 'Oxford', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
                    { name: 'Chen W.', country: '🇨🇳', school: 'Harvard', img: 'https://randomuser.me/api/portraits/men/52.jpg' },
                    { name: 'Fatima A.', country: '🇦🇪', school: 'Cambridge', img: 'https://randomuser.me/api/portraits/women/89.jpg' },
                    { name: 'James R.', country: '🇺🇸', school: 'Yale', img: 'https://randomuser.me/api/portraits/men/67.jpg' },
                    { name: 'Mei L.', country: '🇸🇬', school: 'UCLA', img: 'https://randomuser.me/api/portraits/women/33.jpg' },
                    { name: 'Raj P.', country: '🇮🇳', school: 'Berkeley', img: 'https://randomuser.me/api/portraits/men/22.jpg' },
                    { name: 'Emma T.', country: '🇦🇺', school: 'NYU', img: 'https://randomuser.me/api/portraits/women/17.jpg' },
                    { name: 'Omar H.', country: '🇪🇬', school: 'Columbia', img: 'https://randomuser.me/api/portraits/men/45.jpg' },
                    { name: 'Lisa K.', country: '🇰🇷', school: 'Princeton', img: 'https://randomuser.me/api/portraits/women/55.jpg' },
                    { name: 'Amir S.', country: '🇮🇷', school: 'Duke', img: 'https://randomuser.me/api/portraits/men/78.jpg' },
                  ].map((student, i) => (
                    <div key={i} className="relative group cursor-pointer">
                      <img
                        src={student.img}
                        alt={student.name}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {student.name} {student.country}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* New Admits Section */}
              <div className="bg-white dark:bg-white/[0.06] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  <h3 className="font-bold text-gray-900 dark:text-white">New admits</h3>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">(89/mo)</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { name: 'Vikram J.', country: '🇮🇳', img: 'https://randomuser.me/api/portraits/men/91.jpg' },
                    { name: 'Sophie M.', country: '🇫🇷', img: 'https://randomuser.me/api/portraits/women/21.jpg' },
                    { name: 'David L.', country: '🇧🇷', img: 'https://randomuser.me/api/portraits/men/36.jpg' },
                    { name: 'Ananya R.', country: '🇮🇳', img: 'https://randomuser.me/api/portraits/women/76.jpg' },
                    { name: 'Kenji T.', country: '🇯🇵', img: 'https://randomuser.me/api/portraits/men/11.jpg' },
                    { name: 'Maria G.', country: '🇪🇸', img: 'https://randomuser.me/api/portraits/women/49.jpg' },
                    { name: 'Nikhil B.', country: '🇮🇳', img: 'https://randomuser.me/api/portraits/men/85.jpg' },
                    { name: 'Anna W.', country: '🇩🇪', img: 'https://randomuser.me/api/portraits/women/62.jpg' },
                    { name: 'Hassan M.', country: '🇵🇰', img: 'https://randomuser.me/api/portraits/men/73.jpg' },
                    { name: 'Yuki S.', country: '🇯🇵', img: 'https://randomuser.me/api/portraits/women/38.jpg' },
                    { name: 'Carlos R.', country: '🇲🇽', img: 'https://randomuser.me/api/portraits/men/29.jpg' },
                    { name: 'Zara K.', country: '🇬🇧', img: 'https://randomuser.me/api/portraits/women/83.jpg' },
                  ].map((student, i) => (
                    <div key={i} className="relative group cursor-pointer">
                      <img
                        src={student.img}
                        alt={student.name}
                        className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 hover:scale-110 transition-transform"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {student.name} {student.country}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Success Stories / Promo Card */}
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600">
                <div className="absolute inset-0 opacity-10">
                  <svg className="absolute -top-4 -right-4 w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21c-4-4-8-7.5-8-11a8 8 0 1116 0c0 3.5-4 7-8 11z"/>
                    <circle cx="12" cy="10" r="4"/>
                    <path d="M12 7.5l-3 1.5 3 1.5 3-1.5-3-1.5z"/>
                  </svg>
                  <svg className="absolute -bottom-2 -left-2 w-20 h-20 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <div className="relative p-5 h-32 flex flex-col justify-end">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <span className="text-white/90 text-xs font-medium">10,000+ students</span>
                  </div>
                  <p className="text-white text-sm font-semibold leading-tight">
                    Found their dream university with StudyBuddy
                  </p>
                  <button className="mt-2 text-white/90 text-sm font-bold hover:text-white transition-colors text-left flex items-center gap-1">
                    Read success stories
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
                    </svg>
                  </button>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-white dark:bg-white/[0.06] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  <h3 className="font-bold text-gray-900 dark:text-white">Upcoming deadlines</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { school: 'MIT', program: 'Fall 2026', date: 'Jan 1', urgent: true },
                    { school: 'Stanford', program: 'Fall 2026', date: 'Jan 5', urgent: true },
                    { school: 'Harvard', program: 'Fall 2026', date: 'Jan 1', urgent: true },
                    { school: 'Oxford', program: 'Fall 2026', date: 'Jan 15', urgent: false },
                  ].map((deadline, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">{deadline.school}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-1">{deadline.program}</span>
                      </div>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        deadline.urgent
                          ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                          : "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400"
                      )}>
                        {deadline.date}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Your Targets - Shortlisted Universities */}
              {shortlist.length > 0 && (
                <div className="bg-white dark:bg-white/[0.06] rounded-2xl border border-gray-200 dark:border-white/10 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                    <h3 className="font-bold text-gray-900 dark:text-white">Your targets</h3>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">({shortlist.length})</span>
                  </div>
                  <div className="space-y-2">
                    {shortlist.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        onClick={() => {
                          const uni = universities.find(u => u.id === item.university_id)
                          if (uni) setSelectedUni(uni)
                        }}
                      >
                        <img
                          src={getUniversityImage(item.university) || getBackgroundImage(item.university)}
                          alt={item.university.name}
                          className="w-10 h-10 rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.src = getBackgroundImage(item.university)
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {item.university.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {item.university.country}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium",
                            item.category === 'dream' ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400' :
                            item.category === 'target' ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' :
                            'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                          )}>
                            {item.category}
                          </span>
                          {item.is_locked && (
                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                              <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                    {shortlist.length > 5 && (
                      <button className="w-full text-center text-sm text-emerald-500 dark:text-emerald-400 font-medium py-2 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors">
                        View all {shortlist.length} targets →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* University Detail Modal */}
      {selectedUni && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedUni(null)}
        >
          <div
            className="bg-gray-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with University Photo */}
            <div className="relative h-48 sm:h-64">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800" />
              <img
                src={getUniversityImage(selectedUni) || getBackgroundImage(selectedUni)}
                alt={selectedUni.name}
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (!target.src.includes('unsplash')) {
                    target.src = getBackgroundImage(selectedUni)
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />

              {/* Heart Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (isShortlisted(selectedUni.id)) {
                    const item = getShortlistItem(selectedUni.id)
                    if (!item?.is_locked) handleRemoveFromShortlist(selectedUni.id)
                  } else {
                    handleShortlist(selectedUni, 'target')
                  }
                }}
                className={cn(
                  "absolute top-4 right-16 w-10 h-10 rounded-full flex items-center justify-center transition-all",
                  isShortlisted(selectedUni.id)
                    ? "bg-emerald-500 text-white"
                    : "bg-black/50 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/70"
                )}
              >
                {Icons.heart(isShortlisted(selectedUni.id))}
              </button>

              {/* Close Button */}
              <button
                onClick={() => setSelectedUni(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                {Icons.close}
              </button>

              {/* University Info */}
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 line-clamp-2">
                  {selectedUni.name}
                </h2>
                <p className="text-white/80 flex items-center gap-2">
                  {Icons.location}
                  {selectedUni.city ? `${selectedUni.city}, ` : ''}{selectedUni.country}
                </p>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 grid md:grid-cols-2 gap-6">
              {/* Left Side - Stats */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="text-yellow-500">{Icons.star}</span>
                  University Stats
                </h3>

                <div className="space-y-4">
                  <ProgressBar
                    value={getRankingScore(selectedUni.ranking)}
                    label="Ranking Score"
                    color={getScoreColor(getRankingScore(selectedUni.ranking))}
                  />
                  <ProgressBar
                    value={getTuitionScore(selectedUni.tuition_max)}
                    label="Affordability"
                    color={getScoreColor(getTuitionScore(selectedUni.tuition_max))}
                  />
                  <ProgressBar
                    value={getAcceptanceScore(selectedUni.acceptance_rate)}
                    label="Acceptance Rate"
                    color={getScoreColor(getAcceptanceScore(selectedUni.acceptance_rate))}
                  />
                  <ProgressBar
                    value={selectedUni.programs?.length ? Math.min(selectedUni.programs.length * 15, 100) : 50}
                    label="Program Variety"
                    color="bg-blue-500"
                  />
                </div>

                {/* Quick Stats */}
                <div className="bg-gray-800/50 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tuition</span>
                    <span className="text-white font-bold">
                      {selectedUni.tuition_max ? formatCurrency(selectedUni.tuition_max) + '/yr' : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">World Ranking</span>
                    <span className="text-white font-bold">#{selectedUni.ranking || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acceptance Rate</span>
                    <span className="text-white font-bold">
                      {selectedUni.acceptance_rate ? `${selectedUni.acceptance_rate}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min GPA</span>
                    <span className="text-white font-bold">{selectedUni.min_gpa || 'N/A'}</span>
                  </div>
                </div>

                {/* Website Link */}
                {selectedUni.website && (
                  <a
                    href={selectedUni.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {Icons.globe}
                    Visit University Website
                  </a>
                )}
              </div>

              {/* Right Side - Shortlist Options */}
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white">Add to Shortlist</h3>

                {/* Category Selection */}
                <div className="space-y-3">
                  {(['dream', 'target', 'safe'] as const).map((category) => {
                    const shortlistItem = getShortlistItem(selectedUni.id)
                    const isSelected = shortlistItem?.category === category
                    const config = CATEGORY_CONFIG[category]

                    return (
                      <button
                        key={category}
                        onClick={() => handleShortlist(selectedUni, category)}
                        disabled={shortlistItem?.is_locked}
                        className={cn(
                          "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between",
                          isSelected
                            ? `${config.color} border-transparent text-white`
                            : "bg-gray-800/50 border-gray-700 text-gray-300 hover:border-gray-500"
                        )}
                      >
                        <div>
                          <div className="font-bold text-lg">{config.label}</div>
                          <div className={cn("text-sm", isSelected ? "text-white/80" : "text-gray-500")}>
                            {config.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            {Icons.check}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Lock/Remove Actions */}
                {getShortlistItem(selectedUni.id) && (
                  <div className="space-y-3 pt-4 border-t border-gray-700">
                    {!getShortlistItem(selectedUni.id)?.is_locked ? (
                      <>
                        <button
                          onClick={() => handleLock(getShortlistItem(selectedUni.id)!)}
                          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                        >
                          {Icons.lock}
                          Lock for Application
                        </button>
                        <button
                          onClick={() => {
                            handleRemoveFromShortlist(selectedUni.id)
                            setSelectedUni(null)
                          }}
                          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-medium transition-colors"
                        >
                          Remove from Shortlist
                        </button>
                      </>
                    ) : (
                      <div className="w-full py-3 bg-emerald-500/20 text-emerald-400 rounded-xl font-bold text-center flex items-center justify-center gap-2">
                        {Icons.lock}
                        Locked for Application
                      </div>
                    )}
                  </div>
                )}

                {/* Not shortlisted message */}
                {!getShortlistItem(selectedUni.id) && (
                  <p className="text-gray-500 text-sm text-center">
                    Select a category above to add this university to your shortlist
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External University Shortlist Modal */}
      {selectedExternalUni && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExternalUni(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-500/20 dark:to-green-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">{selectedExternalUni.alpha_two_code === 'US' ? '🇺🇸' : selectedExternalUni.alpha_two_code === 'GB' ? '🇬🇧' : selectedExternalUni.alpha_two_code === 'CA' ? '🇨🇦' : selectedExternalUni.alpha_two_code === 'AU' ? '🇦🇺' : selectedExternalUni.alpha_two_code === 'DE' ? '🇩🇪' : selectedExternalUni.alpha_two_code === 'IN' ? '🇮🇳' : '🎓'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedExternalUni.name}
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
                    {Icons.location}
                    {selectedExternalUni.state_province ? `${selectedExternalUni.state_province}, ` : ''}{selectedExternalUni.country}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExternalUni(null)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {Icons.close}
                </button>
              </div>
              {selectedExternalUni.website && (
                <a
                  href={selectedExternalUni.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-emerald-500 dark:text-emerald-400 text-sm inline-flex items-center gap-1 hover:underline"
                >
                  {Icons.globe}
                  Visit website
                </a>
              )}
            </div>

            {/* Category Selection */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                Add to your shortlist as:
              </h3>
              <div className="space-y-3">
                {(['dream', 'target', 'safe'] as const).map((category) => {
                  const config = CATEGORY_CONFIG[category]
                  return (
                    <button
                      key={category}
                      onClick={() => handleShortlistExternal(selectedExternalUni, category)}
                      disabled={shortlistingExternal}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between",
                        "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500"
                      )}
                    >
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{config.label}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {config.description}
                        </div>
                      </div>
                      <div className={cn("w-4 h-4 rounded-full", config.color)} />
                    </button>
                  )
                })}
              </div>
              {shortlistingExternal && (
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-500">
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Adding to shortlist...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
