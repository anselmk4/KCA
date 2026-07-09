-- ============================================================
-- ANSELLA - Course benefits, Homework tables, and category expansion
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Extend courses table with benefits column
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS benefits TEXT;

-- 2. Create homeworks table
CREATE TABLE IF NOT EXISTS public.homeworks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create homework_submissions table
CREATE TABLE IF NOT EXISTS public.homework_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  homework_id UUID NOT NULL REFERENCES public.homeworks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  grade FLOAT,
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'SUBMITTED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT homework_student_unique UNIQUE (homework_id, student_id)
);

-- 4. Enable RLS on new tables
ALTER TABLE public.homeworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework_submissions ENABLE ROW LEVEL SECURITY;

-- 5. Homeworks RLS policies
DROP POLICY IF EXISTS "Anyone can read homeworks" ON public.homeworks;
CREATE POLICY "Anyone can read homeworks" ON public.homeworks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Instructors can manage homeworks" ON public.homeworks;
CREATE POLICY "Instructors can manage homeworks" ON public.homeworks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id = course_id AND c.instructor_id = auth.uid()
    )
  );

-- 6. Homework Submissions RLS policies
DROP POLICY IF EXISTS "Students can view own submissions" ON public.homework_submissions;
CREATE POLICY "Students can view own submissions" ON public.homework_submissions
  FOR SELECT TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can insert own submissions" ON public.homework_submissions;
CREATE POLICY "Students can insert own submissions" ON public.homework_submissions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Students can update own submissions" ON public.homework_submissions;
CREATE POLICY "Students can update own submissions" ON public.homework_submissions
  FOR UPDATE TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors can view course submissions" ON public.homework_submissions;
CREATE POLICY "Instructors can view course submissions" ON public.homework_submissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homeworks h
      JOIN public.courses c ON c.id = h.course_id
      WHERE h.id = homework_id AND c.instructor_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Instructors can grade submissions" ON public.homework_submissions;
CREATE POLICY "Instructors can grade submissions" ON public.homework_submissions
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.homeworks h
      JOIN public.courses c ON c.id = h.course_id
      WHERE h.id = homework_id AND c.instructor_id = auth.uid()
    )
  );

-- 7. Insert expanded categories
INSERT INTO public.categories (id, name, slug, description, icon, color, is_active)
VALUES
  ('c109e25e-e478-4b72-8c59-6f0d67e1560b', 'Smart Contracts', 'smart-contracts', 'Développement de contrats intelligents', 'Code', '#10B981', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1560c', 'Solidity', 'solidity', 'Le langage de programmation de référence pour Ethereum', 'Code2', '#3B82F6', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1560d', 'DApps', 'dapps', 'Applications décentralisées', 'Cpu', '#EC4899', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1560e', 'FinTech', 'fintech', 'Technologies financières innovantes', 'DollarSign', '#F59E0B', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1560f', 'IA Générative', 'ia-generative', 'Créer avec des intelligences artificielles génératives', 'Sparkles', '#8B5CF6', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561a', 'Prompt Engineering', 'prompt-engineering', 'L''art de guider les modèles de langage', 'MessageSquare', '#06B6D4', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561b', 'Machine Learning', 'machine-learning', 'Apprentissage automatique et prédictions', 'Brain', '#3B82F6', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561c', 'Data Science', 'data-science', 'Analyse et traitement de données massives', 'Database', '#10B981', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561d', 'Python', 'python', 'Développement en langage Python pour IA et data', 'FileCode2', '#3B82F6', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561e', 'JavaScript', 'javascript', 'Le langage du Web et du développement Web3 front-end', 'Flame', '#F59E0B', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1561f', 'Cybersécurité', 'cybersecurite', 'Protéger les systèmes et les réseaux', 'Lock', '#EF4444', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1562a', 'Cryptographie', 'cryptographie', 'Sécurisation de l''information et protocoles blockchain', 'Key', '#6366F1', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1562b', 'Analyse Technique', 'analyse-technique', 'Analyse technique des graphiques de crypto-monnaies', 'LineChart', '#10B981', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1562c', 'Analyse Fondamentale', 'analyse-fondamentale', 'Évaluation de la valeur intrinsèque des projets crypto', 'Search', '#8B5CF6', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1562d', 'Staking', 'staking', 'Participer au consensus proof-of-stake et gagner des intérêts', 'ShieldCheck', '#10B981', true),
  ('c109e25e-e478-4b72-8c59-6f0d67e1562e', 'Cloud Computing', 'cloud-computing', 'Architecture et infrastructure cloud pour applications modernes', 'Cloud', '#06B6D4', true)
ON CONFLICT (id) DO NOTHING;

-- 8. Reload PostgREST schema cache to reflect columns instantly
NOTIFY pgrst, 'reload schema';
