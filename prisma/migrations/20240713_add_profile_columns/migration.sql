-- ------------------------------------------------------------
-- Migration: add_profile_columns
-- ------------------------------------------------------------
-- Extend profiles table with new optional columns for user metadata.
-- These columns are used by the enhanced registration flow.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS twitter TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academy_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academy_tagline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_background TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certifications TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE';

-- Optional: community tables (already exist, kept for reference)
-- CREATE TABLE IF NOT EXISTS public.community_posts (...);
-- CREATE TABLE IF NOT EXISTS public.community_comments (...);

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
