-- =============================================================================
-- Migration de Sécurité RLS — Ansella / Kuettu Crypto Academy
-- À exécuter dans Supabase SQL Editor pour corriger les failles RLS critiques
-- =============================================================================

-- 1. Sécurisation de la table USER_ROLES
-- Empêche les utilisateurs d'insérer ou supprimer des rôles (privilege escalation)
DROP POLICY IF EXISTS "Users can insert own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can delete own roles" ON public.user_roles;

-- Seule la lecture de ses propres rôles reste permise aux utilisateurs
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can read own roles') THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;


-- 2. Sécurisation de la table CERTIFICATES
-- Empêche la génération directe et frauduleuse de certificats par les étudiants
DROP POLICY IF EXISTS "Students can insert own certificates" ON public.certificates;

-- Seule la lecture de ses certificats reste permise
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'certificates' AND policyname = 'Students can select own certificates') THEN
    CREATE POLICY "Students can select own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = student_id);
  END IF;
END $$;


-- 3. Sécurisation de la table PAYMENTS
-- Empêche l'insertion de faux paiements avec statut PAID depuis le client
DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;

-- Seule la lecture de ses paiements reste permise
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can select own payments') THEN
    CREATE POLICY "Users can select own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;


-- 4. Sécurisation de la table ENROLLMENTS
-- Empêche l'auto-inscription gratuite et la modification de progression frauduleuse
DROP POLICY IF EXISTS "Students can insert own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Students can update own enrollments" ON public.enrollments;

-- Seule la lecture reste permise (étudiants pour leurs cours, formateurs pour leurs élèves)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can read own enrollments') THEN
    CREATE POLICY "Students can read own enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id);
  END IF;
END $$;


-- 5. Sécurisation de la table QUIZ_ATTEMPTS
-- Empêche la falsification des scores de quiz côté client (doit passer par /api/quiz-attempts)
DROP POLICY IF EXISTS "Students can insert own quiz attempts" ON public.quiz_attempts;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'quiz_attempts' AND policyname = 'Students can select own quiz attempts') THEN
    CREATE POLICY "Students can select own quiz attempts" ON public.quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = student_id);
  END IF;
END $$;


-- 6. Notification de rechargement du cache de schéma PostgREST
NOTIFY pgrst, 'reload schema';
