-- ============================================================
-- ANSELLA - Course Reviews & Rating System
-- Migration SQL à exécuter dans le Supabase SQL Editor
-- ============================================================

-- 1. Ajouter les colonnes de synthèse sur la table courses si non existantes
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS rating_avg NUMERIC(3,2) DEFAULT 0.0;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS reviews_count INT DEFAULT 0;

-- 2. Créer la table course_reviews
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'PUBLISHED' CHECK (status IN ('PUBLISHED', 'PENDING', 'FLAGGED', 'HIDDEN')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT course_user_review_unique UNIQUE (course_id, user_id)
);

-- 3. Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_course_reviews_course_id ON public.course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_user_id ON public.course_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_course_reviews_created_at ON public.course_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_reviews_status ON public.course_reviews(status);

-- 4. Fonction & Trigger pour recalcul automatique de la note moyenne et du nombre d'avis
CREATE OR REPLACE FUNCTION public.sync_course_review_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_course_id UUID;
  new_avg NUMERIC(3,2);
  new_count INT;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_course_id := OLD.course_id;
  ELSE
    target_course_id := NEW.course_id;
  END IF;

  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 2), 0.0),
    COUNT(*)
  INTO new_avg, new_count
  FROM public.course_reviews
  WHERE course_id = target_course_id AND status = 'PUBLISHED';

  UPDATE public.courses
  SET 
    rating_avg = new_avg,
    reviews_count = new_count
  WHERE id = target_course_id;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_course_review_stats ON public.course_reviews;
CREATE TRIGGER trg_sync_course_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.course_reviews
FOR EACH ROW EXECUTE FUNCTION public.sync_course_review_stats();

-- 5. Activer Row Level Security (RLS)
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS
DROP POLICY IF EXISTS "Anyone can view published reviews" ON public.course_reviews;
CREATE POLICY "Anyone can view published reviews"
  ON public.course_reviews
  FOR SELECT
  USING (status = 'PUBLISHED' OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated users can create reviews" ON public.course_reviews;
CREATE POLICY "Authenticated users can create reviews"
  ON public.course_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reviews" ON public.course_reviews;
CREATE POLICY "Users can update their own reviews"
  ON public.course_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.course_reviews;
CREATE POLICY "Users can delete their own reviews"
  ON public.course_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Accorder les droits de gestion aux administrateurs
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.course_reviews;
CREATE POLICY "Admins can manage all reviews"
  ON public.course_reviews
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid() AND r.name IN ('ADMIN', 'SUPER_ADMIN')
    )
  );
