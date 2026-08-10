-- ============================================================
-- ANSELLA - Profile columns + Community tables
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend profiles table with new columns
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

-- 2. Community Posts table
CREATE TABLE IF NOT EXISTS public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Community Comments table
CREATE TABLE IF NOT EXISTS public.community_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can insert own posts" ON public.community_posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.community_posts;

CREATE POLICY "Authenticated can read posts"
  ON public.community_posts FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own posts"
  ON public.community_posts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 5. RLS for community_comments
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.community_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.community_comments;

CREATE POLICY "Authenticated can read comments"
  ON public.community_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert own comments"
  ON public.community_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.community_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- 6. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
