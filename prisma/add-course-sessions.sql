-- ============================================================
-- ANSELLA - Course Sessions / Classes / Cohorts for Academic Courses
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Create course_sessions table
CREATE TABLE IF NOT EXISTS public.course_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'UPCOMING', -- 'UPCOMING' | 'IN_PROGRESS' | 'COMPLETED' | 'ARCHIVED'
  max_capacity INT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add session_id to enrollments table
ALTER TABLE public.enrollments 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.course_sessions(id) ON DELETE SET NULL;

-- 2b. Ensure type column exists on courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'academic';

-- 3. Create indexes for high-speed queries and filtering
CREATE INDEX IF NOT EXISTS idx_course_sessions_course_id ON public.course_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sessions_status ON public.course_sessions(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_session_id ON public.enrollments(session_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.course_sessions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for course_sessions
DROP POLICY IF EXISTS "Public can view sessions for published courses" ON public.course_sessions;
CREATE POLICY "Public can view sessions for published courses" ON public.course_sessions
  FOR SELECT TO authenticated, anon
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.status = 'PUBLISHED'
    )
  );

DROP POLICY IF EXISTS "Instructors and Admins can manage their course sessions" ON public.course_sessions;
CREATE POLICY "Instructors and Admins can manage their course sessions" ON public.course_sessions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('SUPER_ADMIN', 'ADMIN', 'ACADEMIC_ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('SUPER_ADMIN', 'ADMIN', 'ACADEMIC_ADMIN')
    )
  );
