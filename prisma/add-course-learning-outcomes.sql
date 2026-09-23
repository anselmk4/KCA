-- ============================================================
-- ANSELLA - Add learning_outcomes and prerequisites to courses
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[] DEFAULT '{}';
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS prerequisites TEXT[] DEFAULT '{}';

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
