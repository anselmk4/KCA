-- ============================================================
-- ANSELLA - Table des Produits Digitaux (E-books, PDF, Modèles)
-- Règle d'or : Plafond strict de prix <= 25.00 USD
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- ============================================================

-- 1. Création de la table digital_products
CREATE TABLE IF NOT EXISTS public.digital_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  cover_image_url TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size_bytes BIGINT,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  category TEXT NOT NULL DEFAULT 'Autre',
  tags TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  preview_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- RÈGLE TARIFAIRE : CONTRAINTE DE PLAFONNEMENT À 25.00 $ MAX UNIQUEMENT SUR LES E-BOOKS & GUIDES PDF
  CONSTRAINT check_digital_product_price_cap CHECK (
    price >= 0.00 AND (
      (
        LOWER(category) NOT LIKE '%ebook%' 
        AND LOWER(category) NOT LIKE '%e-book%' 
        AND LOWER(category) NOT LIKE '%pdf%'
        AND LOWER(category) NOT LIKE '%guide%'
        AND LOWER(COALESCE(file_name, '')) NOT LIKE '%.pdf'
        AND LOWER(COALESCE(file_name, '')) NOT LIKE '%.epub'
      )
      OR price <= 25.00
    )
  )
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_digital_products_author ON public.digital_products(author_id);
CREATE INDEX IF NOT EXISTS idx_digital_products_status ON public.digital_products(status);
CREATE INDEX IF NOT EXISTS idx_digital_products_created_at ON public.digital_products(created_at DESC);

-- 2. Création de la table des achats de produits digitaux
CREATE TABLE IF NOT EXISTS public.digital_product_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  price_paid NUMERIC(10, 2) NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'momo',
  payment_status TEXT NOT NULL DEFAULT 'COMPLETED',
  transaction_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_digital_purchases_user ON public.digital_product_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_digital_purchases_product ON public.digital_product_purchases(product_id);

-- 3. Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_digital_products_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_digital_products_updated_at ON public.digital_products;
CREATE TRIGGER trg_digital_products_updated_at
BEFORE UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION update_digital_products_modtime();

-- 4. Configuration des Politiques de Sécurité RLS (Row Level Security)
ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_product_purchases ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour digital_products :
-- A. Tout le monde (visiteurs publics et connectés) peut lire les produits publiés
DROP POLICY IF EXISTS "Public can read published digital products" ON public.digital_products;
CREATE POLICY "Public can read published digital products"
  ON public.digital_products
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

-- B. Seul l'auteur authentifié peut créer ses propres produits digitaux
DROP POLICY IF EXISTS "Author can insert own digital products" ON public.digital_products;
CREATE POLICY "Author can insert own digital products"
  ON public.digital_products
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- C. Seul l'auteur peut modifier ses propres produits digitaux
DROP POLICY IF EXISTS "Author can update own digital products" ON public.digital_products;
CREATE POLICY "Author can update own digital products"
  ON public.digital_products
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- D. Seul l'auteur peut supprimer ses propres produits digitaux
DROP POLICY IF EXISTS "Author can delete own digital products" ON public.digital_products;
CREATE POLICY "Author can delete own digital products"
  ON public.digital_products
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Politiques RLS pour digital_product_purchases :
-- L'utilisateur peut voir ses propres achats, et l'auteur du produit peut voir qui a acheté
DROP POLICY IF EXISTS "Users can read own purchases" ON public.digital_product_purchases;
CREATE POLICY "Users can read own purchases"
  ON public.digital_product_purchases
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR auth.uid() IN (SELECT author_id FROM public.digital_products WHERE id = product_id)
  );

-- Les achats peuvent être insérés lors du paiement validé
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.digital_product_purchases;
CREATE POLICY "Users can insert own purchases"
  ON public.digital_product_purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5. Bucket Supabase Storage sécurisé pour les produits digitaux
-- Note : Créez le bucket 'digital-products' en mode privé dans Supabase Storage si ce n'est pas déjà fait.
INSERT INTO storage.buckets (id, name, public)
VALUES ('digital-products', 'digital-products', false)
ON CONFLICT (id) DO NOTHING;

-- Politique Storage : L'auteur peut téléverser ses fichiers
DROP POLICY IF EXISTS "Author can upload digital product files" ON storage.objects;
CREATE POLICY "Author can upload digital product files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'digital-products');

-- Politique Storage : L'auteur et les acheteurs enregistrés peuvent lire le fichier
DROP POLICY IF EXISTS "Purchasers and authors can download product files" ON storage.objects;
CREATE POLICY "Purchasers and authors can download product files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'digital-products'
    AND (
      -- Soit l'utilisateur est le propriétaire du fichier (owner)
      auth.uid() = owner
      -- Soit l'utilisateur a acheté un produit digital pointant vers ce fichier
      OR EXISTS (
        SELECT 1 FROM public.digital_product_purchases pur
        JOIN public.digital_products prod ON prod.id = pur.product_id
        WHERE pur.user_id = auth.uid()
          AND prod.file_url LIKE '%' || name || '%'
      )
    )
  );

-- 6. Notifier PostgREST pour actualiser le cache schéma
NOTIFY pgrst, 'reload schema';
