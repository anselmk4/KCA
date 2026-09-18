-- ============================================================
-- KCA - Règle Tarifaire : Plafonnement des Cours en Autonomie (25$ Max)
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Mise en conformité des cours existants
-- Plafonne à 25$ tout cours existant configuré en autonomie (self_paced) dont le prix excède 25$
UPDATE public.courses
SET 
  price = 25,
  allow_installments = false,
  installments_count = 1,
  updated_at = now()
WHERE type = 'self_paced' AND price > 25;

-- 2. Sécurité Base de Données (Contrainte CHECK)
-- Empêche formellement l'insertion ou la modification d'un cours en autonomie avec un prix supérieur à 25$
ALTER TABLE public.courses
DROP CONSTRAINT IF EXISTS check_self_paced_course_price;

ALTER TABLE public.courses
ADD CONSTRAINT check_self_paced_course_price
CHECK (type != 'self_paced' OR price <= 25);
