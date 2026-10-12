-- Migration SQL : Assouplissement du plafond tarifaire des produits digitaux
-- Règle : Seuls les E-books et Guides PDF sont plafonnés à 25.00 $ USD max.
-- Pour les logiciels, scripts ZIP, templates Notion/Figma, prompts, le formateur fixe librement son prix.

DO $$
BEGIN
  -- 1. Supprimer l'ancienne contrainte qui bloquait tous les produits à 25$
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'digital_products' 
      AND constraint_name = 'check_digital_product_price_cap'
  ) THEN
    ALTER TABLE public.digital_products DROP CONSTRAINT check_digital_product_price_cap;
  END IF;

  -- 2. Ajouter la nouvelle contrainte ciblée uniquement sur les E-books / PDF
  ALTER TABLE public.digital_products 
    ADD CONSTRAINT check_digital_product_price_cap 
    CHECK (
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
    );
END $$;
