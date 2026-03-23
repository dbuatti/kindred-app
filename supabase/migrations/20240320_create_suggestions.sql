-- Create suggestions table
CREATE TABLE public.suggestions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID REFERENCES public.people(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  suggested_value TEXT NOT NULL,
  suggested_by_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access" ON public.suggestions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.suggestions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.suggestions FOR UPDATE USING (true);