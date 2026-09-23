-- ============================================================
-- ANSELLA - Mise à jour du cours en mode Autonomie (self_paced)
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================

UPDATE public.courses
SET 
  type = 'self_paced',
  allow_installments = false,
  installments_count = 1,
  price = LEAST(price, 25),
  updated_at = now()
WHERE title ILIKE '%entreprendre en RDC%';
