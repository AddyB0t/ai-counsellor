-- AI Counsellor Database Schema
-- Run this in Supabase SQL Editor

-- Extend Supabase auth with profile
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  current_stage INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User onboarding data
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Step 1: Academic Background
  education_level TEXT,
  degree TEXT,
  graduation_year INTEGER,
  gpa DECIMAL(4,2),
  gpa_scale DECIMAL(3,1) DEFAULT 4.0,

  -- Step 2: Study Goals
  intended_degree TEXT,
  field_of_study TEXT,
  target_intake TEXT,
  preferred_countries TEXT[],

  -- Step 3: Budget
  budget_min INTEGER DEFAULT 10000,
  budget_max INTEGER DEFAULT 50000,
  funding_type TEXT,

  -- Step 4: Readiness (Updated with test type selection)
  english_test_type TEXT,        -- NULL (none), 'ielts', 'toefl'
  english_test_status TEXT,      -- 'Not started', 'Scheduled', 'Completed'
  english_test_score DECIMAL(4,1),

  aptitude_test_type TEXT,       -- NULL (none), 'gre', 'gmat'
  aptitude_test_status TEXT,     -- 'Not started', 'Scheduled', 'Completed'
  aptitude_test_score INTEGER,

  sop_status TEXT DEFAULT 'Not started',  -- 'Not started', 'Draft ready', 'Complete'

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Universities (seeded + API data)
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  ranking INTEGER,
  tuition_min INTEGER,
  tuition_max INTEGER,
  acceptance_rate DECIMAL(5,2),
  min_gpa DECIMAL(3,2),
  programs TEXT[],
  requirements JSONB DEFAULT '{}',
  website TEXT,
  logo_url TEXT,
  data_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Shortlisted universities
CREATE TABLE shortlisted_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('dream', 'target', 'safe')),
  is_locked BOOLEAN DEFAULT false,
  ai_reasoning TEXT,
  fit_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, university_id)
);

-- Tasks / To-dos
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_shortlisted_user_id ON shortlisted_universities(user_id);
CREATE INDEX idx_shortlisted_university_id ON shortlisted_universities(university_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_universities_country ON universities(country);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlisted_universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- User profiles policies
CREATE POLICY "Users can view own user_profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Shortlist policies
CREATE POLICY "Users can view own shortlist" ON shortlisted_universities
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own shortlist" ON shortlisted_universities
  FOR ALL USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own tasks" ON tasks
  FOR ALL USING (auth.uid() = user_id);

-- Universities policies (anyone can view)
CREATE POLICY "Anyone can view universities" ON universities
  FOR SELECT USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to recalculate user stage
CREATE OR REPLACE FUNCTION recalculate_stage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_onboarding_completed BOOLEAN;
    v_shortlist_count INTEGER;
    v_locked_count INTEGER;
    v_new_stage INTEGER;
BEGIN
    -- Get onboarding status
    SELECT onboarding_completed INTO v_onboarding_completed
    FROM profiles WHERE id = p_user_id;

    -- Count shortlisted and locked universities
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_locked)
    INTO v_shortlist_count, v_locked_count
    FROM shortlisted_universities WHERE user_id = p_user_id;

    -- Calculate stage
    IF v_locked_count >= 1 THEN
        v_new_stage := 4;
    ELSIF v_shortlist_count >= 1 THEN
        v_new_stage := 3;
    ELSIF v_onboarding_completed THEN
        v_new_stage := 2;
    ELSE
        v_new_stage := 1;
    END IF;

    -- Update profile
    UPDATE profiles SET current_stage = v_new_stage WHERE id = p_user_id;

    RETURN v_new_stage;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate stage on shortlist changes
CREATE OR REPLACE FUNCTION trigger_recalculate_stage()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM recalculate_stage(OLD.user_id);
        RETURN OLD;
    ELSE
        PERFORM recalculate_stage(NEW.user_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shortlist_stage_trigger
  AFTER INSERT OR UPDATE OR DELETE ON shortlisted_universities
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_stage();

-- Sample university data for testing
INSERT INTO universities (name, country, city, ranking, tuition_min, tuition_max, acceptance_rate, min_gpa, programs) VALUES
('Stanford University', 'USA', 'Stanford, CA', 3, 55000, 60000, 4.3, 3.9, ARRAY['Computer Science', 'Business', 'Engineering']),
('MIT', 'USA', 'Cambridge, MA', 1, 55000, 58000, 3.9, 3.9, ARRAY['Computer Science', 'Engineering', 'Physics']),
('Harvard University', 'USA', 'Cambridge, MA', 2, 54000, 57000, 3.4, 3.9, ARRAY['Business', 'Law', 'Medicine']),
('UC Berkeley', 'USA', 'Berkeley, CA', 22, 44000, 48000, 14.5, 3.7, ARRAY['Computer Science', 'Engineering', 'Business']),
('University of Michigan', 'USA', 'Ann Arbor, MI', 25, 52000, 55000, 20.2, 3.6, ARRAY['Engineering', 'Business', 'Computer Science']),
('University of Oxford', 'UK', 'Oxford', 4, 35000, 45000, 17.5, 3.7, ARRAY['Business', 'Computer Science', 'Law']),
('University of Cambridge', 'UK', 'Cambridge', 5, 35000, 45000, 21.0, 3.7, ARRAY['Engineering', 'Computer Science', 'Medicine']),
('Imperial College London', 'UK', 'London', 8, 38000, 42000, 14.3, 3.5, ARRAY['Engineering', 'Computer Science', 'Business']),
('University of Toronto', 'Canada', 'Toronto', 18, 45000, 50000, 43.0, 3.5, ARRAY['Computer Science', 'Engineering', 'Business']),
('University of British Columbia', 'Canada', 'Vancouver', 35, 42000, 48000, 52.4, 3.4, ARRAY['Computer Science', 'Engineering', 'Business']),
('McGill University', 'Canada', 'Montreal', 31, 25000, 35000, 41.2, 3.4, ARRAY['Business', 'Engineering', 'Medicine']),
('University of Melbourne', 'Australia', 'Melbourne', 33, 38000, 45000, 70.0, 3.3, ARRAY['Business', 'Engineering', 'Computer Science']),
('University of Sydney', 'Australia', 'Sydney', 41, 40000, 48000, 30.0, 3.3, ARRAY['Business', 'Engineering', 'Law']),
('Technical University of Munich', 'Germany', 'Munich', 50, 500, 2000, 8.0, 3.5, ARRAY['Engineering', 'Computer Science', 'Physics']),
('RWTH Aachen University', 'Germany', 'Aachen', 87, 500, 1500, 25.0, 3.3, ARRAY['Engineering', 'Computer Science']);
