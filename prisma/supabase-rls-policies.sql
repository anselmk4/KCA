-- =============================================================================
-- Kuettu Crypto Academy — Supabase RLS Policies
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- ==================== COURSES TABLE ====================
-- Allow all authenticated users to READ courses (students need to see them)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Anyone can read published courses'
  ) THEN
    CREATE POLICY "Anyone can read published courses"
      ON public.courses
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow instructors to INSERT their own courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Instructors can insert own courses'
  ) THEN
    CREATE POLICY "Instructors can insert own courses"
      ON public.courses
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = instructor_id);
  END IF;
END $$;

-- Allow instructors to UPDATE their own courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Instructors can update own courses'
  ) THEN
    CREATE POLICY "Instructors can update own courses"
      ON public.courses
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = instructor_id)
      WITH CHECK (auth.uid() = instructor_id);
  END IF;
END $$;

-- Allow instructors to DELETE their own courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Instructors can delete own courses'
  ) THEN
    CREATE POLICY "Instructors can delete own courses"
      ON public.courses
      FOR DELETE
      TO authenticated
      USING (auth.uid() = instructor_id);
  END IF;
END $$;

-- ==================== PROFILES TABLE ====================
-- Allow users to read any profile (needed for instructor names etc.)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Authenticated users can read profiles'
  ) THEN
    CREATE POLICY "Authenticated users can read profiles"
      ON public.profiles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow users to insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.profiles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Allow users to update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- ==================== USER_ROLES TABLE ====================
-- Allow users to read their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can read own roles'
  ) THEN
    CREATE POLICY "Users can read own roles"
      ON public.user_roles
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to insert their own role (for registration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can insert own roles'
  ) THEN
    CREATE POLICY "Users can insert own roles"
      ON public.user_roles
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to delete their own roles (for role switching)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can delete own roles'
  ) THEN
    CREATE POLICY "Users can delete own roles"
      ON public.user_roles
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==================== ROLES TABLE ====================
-- Allow all authenticated users to read roles (needed for role resolution)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'roles' AND policyname = 'Authenticated users can read roles'
  ) THEN
    CREATE POLICY "Authenticated users can read roles"
      ON public.roles
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ==================== CATEGORIES TABLE ====================
-- Allow all authenticated users to read categories
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'categories' AND policyname = 'Authenticated users can read categories'
  ) THEN
    CREATE POLICY "Authenticated users can read categories"
      ON public.categories
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- ==================== ENROLLMENTS TABLE ====================
-- Allow students to read their own enrollments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can read own enrollments'
  ) THEN
    CREATE POLICY "Students can read own enrollments"
      ON public.enrollments
      FOR SELECT
      TO authenticated
      USING (auth.uid() = student_id);
  END IF;
END $$;

-- Allow students to insert their own enrollments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can insert own enrollments'
  ) THEN
    CREATE POLICY "Students can insert own enrollments"
      ON public.enrollments
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- Allow instructors to read enrollments for their own courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Instructors can read course enrollments'
  ) THEN
    CREATE POLICY "Instructors can read course enrollments"
      ON public.enrollments
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = enrollments.course_id
          AND courses.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ==================== COURSE_SECTIONS TABLE ====================
-- Allow all authenticated users to read sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_sections' AND policyname = 'Authenticated can read sections'
  ) THEN
    CREATE POLICY "Authenticated can read sections"
      ON public.course_sections
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow instructors to manage sections of their own courses
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'course_sections' AND policyname = 'Instructors can manage own course sections'
  ) THEN
    CREATE POLICY "Instructors can manage own course sections"
      ON public.course_sections
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM courses
          WHERE courses.id = course_sections.course_id
          AND courses.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ==================== LESSONS TABLE ====================
-- Allow all authenticated users to read lessons
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Authenticated can read lessons'
  ) THEN
    CREATE POLICY "Authenticated can read lessons"
      ON public.lessons
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Allow instructors to manage lessons of their own course sections
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Instructors can manage own course lessons'
  ) THEN
    CREATE POLICY "Instructors can manage own course lessons"
      ON public.lessons
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM course_sections
          JOIN courses ON courses.id = course_sections.course_id
          WHERE course_sections.id = lessons.section_id
          AND courses.instructor_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Allow students to UPDATE their own enrollments (needed for progress and status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can update own enrollments'
  ) THEN
    CREATE POLICY "Students can update own enrollments"
      ON public.enrollments
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = student_id)
      WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- ==================== ORDERS & PAYMENTS & PROGRESS & CERTIFICATES ====================

-- Allow users to SELECT and INSERT their own orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can select own orders') THEN
    CREATE POLICY "Users can select own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Users can insert own orders') THEN
    CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow users to SELECT and INSERT their own order items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can select own order items') THEN
    CREATE POLICY "Users can select own order items" ON public.order_items FOR SELECT TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'order_items' AND policyname = 'Users can insert own order items') THEN
    CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT TO authenticated 
      WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()));
  END IF;
END $$;

-- Allow users to SELECT and INSERT their own payments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can select own payments') THEN
    CREATE POLICY "Users can select own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can insert own payments') THEN
    CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Allow students to select, insert and update their own lesson progress
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_progress' AND policyname = 'Students can select own lesson progress') THEN
    CREATE POLICY "Students can select own lesson progress" ON public.lesson_progress FOR SELECT TO authenticated
      USING (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = lesson_progress.enrollment_id AND enrollments.student_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_progress' AND policyname = 'Students can insert own lesson progress') THEN
    CREATE POLICY "Students can insert own lesson progress" ON public.lesson_progress FOR INSERT TO authenticated
      WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = lesson_progress.enrollment_id AND enrollments.student_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lesson_progress' AND policyname = 'Students can update own lesson progress') THEN
    CREATE POLICY "Students can update own lesson progress" ON public.lesson_progress FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = lesson_progress.enrollment_id AND enrollments.student_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.id = lesson_progress.enrollment_id AND enrollments.student_id = auth.uid()));
  END IF;
END $$;

-- Allow students to select and insert their own quiz attempts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Students can select own quiz attempts') THEN
    CREATE POLICY "Students can select own quiz attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Students can insert own quiz attempts') THEN
    CREATE POLICY "Students can insert own quiz attempts" ON public.quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- Allow students to select and insert their own certificates
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Students can select own certificates') THEN
    CREATE POLICY "Students can select own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = student_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Students can insert own certificates') THEN
    CREATE POLICY "Students can insert own certificates" ON public.certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);
  END IF;
END $$;

-- ==================== ENABLE RLS ON ALL TABLES ====================
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.course_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.certificates ENABLE ROW LEVEL SECURITY;

-- ==================== VERIFY ====================
-- List all policies for verification
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
