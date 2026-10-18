-- =========================================================================
-- ANSELLA PLATFORM - ALIGNEMENT DES COLONNES PROFILES (SUPABASE)
-- Exécutez ce script dans Supabase Dashboard > SQL Editor
-- =========================================================================

-- 1. Ajouter les colonnes manquantes dans la table public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academy_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academy_tagline TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

-- 2. Synchroniser les colonnes alias existantes
UPDATE public.profiles 
SET country = nationality 
WHERE (country IS NULL OR country = '') AND nationality IS NOT NULL;

UPDATE public.profiles 
SET nationality = country 
WHERE (nationality IS NULL OR nationality = '') AND country IS NOT NULL;

UPDATE public.profiles 
SET phone_number = phone 
WHERE (phone_number IS NULL OR phone_number = '') AND phone IS NOT NULL;

UPDATE public.profiles 
SET phone = phone_number 
WHERE (phone IS NULL OR phone = '') AND phone_number IS NOT NULL;

-- 3. Recharger le cache PostgREST pour que l'API prenne immédiatement en compte les colonnes
NOTIFY pgrst, 'reload schema';
