-- Add new columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS nickname TEXT,
ADD COLUMN IF NOT EXISTS maiden_name TEXT,
ADD COLUMN IF NOT EXISTS occupation TEXT;