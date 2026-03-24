-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  event_type TEXT NOT NULL, -- 'login', 'signup', 'edit_person', 'add_memory', 'resolve_suggestion'
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Admin can see all logs
CREATE POLICY "Admins can view all activity logs" ON public.activity_logs
FOR SELECT TO authenticated
USING (auth.jwt() ->> 'email' = 'daniele.buatti@gmail.com');

-- Users can insert their own logs
CREATE POLICY "Users can insert their own activity logs" ON public.activity_logs
FOR INSERT TO authenticated
WITH CHECK (true);