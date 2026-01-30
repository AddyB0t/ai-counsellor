export interface User {
  id: string
  email: string
  full_name?: string
  onboarding_completed: boolean
  current_stage: number
  created_at: string
}

export interface UserProfile {
  id: string
  user_id: string
  // Step 1: Academic Background
  education_level?: string
  degree?: string
  graduation_year?: number
  gpa?: number
  gpa_scale?: number
  // Step 2: Study Goals
  intended_degree?: string
  field_of_study?: string
  target_intake?: string
  preferred_countries?: string[]
  // Step 3: Budget
  budget_min?: number
  budget_max?: number
  funding_type?: string
  // Step 4: Readiness
  english_test_type?: string | null
  english_test_status?: string
  english_test_score?: number
  aptitude_test_type?: string | null
  aptitude_test_status?: string
  aptitude_test_score?: number
  sop_status?: string
  created_at: string
  updated_at: string
}

export interface University {
  id: string
  name: string
  country: string
  city?: string
  ranking?: number
  tuition_min?: number
  tuition_max?: number
  acceptance_rate?: number
  min_gpa?: number
  programs?: string[]
  requirements?: Record<string, unknown>
  website?: string
  logo_url?: string
  data_source?: string
  created_at: string
  // Computed fields
  fit_score?: number
  category?: 'dream' | 'target' | 'safe'
  reasons?: string[]
  risks?: string[]
}

export interface ShortlistedUniversity {
  id: string
  user_id: string
  university_id: string
  university: University
  category: 'dream' | 'target' | 'safe'
  is_locked: boolean
  ai_reasoning?: string
  fit_score?: number
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  university_id?: string
  university?: University
  title: string
  description?: string
  category?: string
  is_completed: boolean
  due_date?: string
  created_at: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  actions?: ChatAction[]
}

export interface ChatAction {
  type: 'shortlist' | 'lock' | 'task'
  data: Record<string, unknown>
}

export interface OnboardingData {
  step1: {
    education_level: string
    degree: string
    graduation_year: number
    gpa?: number
    gpa_scale?: number
  }
  step2: {
    intended_degree: string
    field_of_study: string
    target_intake: string
    preferred_countries: string[]
  }
  step3: {
    budget_min: number
    budget_max: number
    funding_type: string
  }
  step4: {
    english_test_type: string | null
    english_test_status?: string
    english_test_score?: number
    aptitude_test_type: string | null
    aptitude_test_status?: string
    aptitude_test_score?: number
    sop_status: string
  }
}
