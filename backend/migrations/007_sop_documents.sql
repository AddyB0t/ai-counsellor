-- SOP documents table for Statement of Purpose drafts
CREATE TABLE IF NOT EXISTS sop_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  title TEXT DEFAULT 'Statement of Purpose',
  content TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_sop_user_id ON sop_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_sop_university_id ON sop_documents(university_id);



-- RLS policies for sop_documents
CREATE POLICY "Users can view own SOPs" ON sop_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own SOPs" ON sop_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own SOPs" ON sop_documents
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own SOPs" ON sop_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_sop_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sop_updated_at_trigger
  BEFORE UPDATE ON sop_documents
  FOR EACH ROW EXECUTE FUNCTION update_sop_updated_at();
