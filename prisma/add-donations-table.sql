-- ==============================================================================
-- MIGRATION SUPABASE : Table dédiée aux dons (Ansella LMS)
-- Description : Crée la table `donations`, les index d'idempotence, le trigger
--               de mise à jour automatique `updated_at` et les politiques RLS.
-- ==============================================================================

-- 1. Création de la table `donations`
CREATE TABLE IF NOT EXISTS public.donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL CHECK (provider IN ('pawapay', 'paypal')),
    provider_reference TEXT NOT NULL UNIQUE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    donor_name TEXT,
    donor_email TEXT,
    message TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Index pour requêtes performantes et idempotence stricte
CREATE INDEX IF NOT EXISTS idx_donations_provider_reference ON public.donations(provider_reference);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_user_id ON public.donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);

-- 3. Fonction et Trigger pour mettre à jour automatiquement `updated_at`
CREATE OR REPLACE FUNCTION public.handle_donations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_donations_updated_at ON public.donations;
CREATE TRIGGER trigger_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_donations_updated_at();

-- 4. Sécurité Row Level Security (RLS)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs authentifiés peuvent consulter l'historique de leurs propres dons
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
    ON public.donations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Le service role (API routes backend via SUPABASE_SERVICE_ROLE_KEY) dispose d'un accès complet
DROP POLICY IF EXISTS "Service role full access on donations" ON public.donations;
CREATE POLICY "Service role full access on donations"
    ON public.donations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Politique optionnelle de lecture publique anonyme d'une donation par son identifiant unique
-- (utile pour afficher l'écran de reçu si l'utilisateur n'est pas connecté)
DROP POLICY IF EXISTS "Public can view donation by id" ON public.donations;
CREATE POLICY "Public can view donation by id"
    ON public.donations
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- Commentaires d'architecture
COMMENT ON TABLE public.donations IS 'Table dédiée aux dons financiers (PawaPay Mobile Money et PayPal) pour Ansella LMS.';
COMMENT ON COLUMN public.donations.amount IS 'Montant en unités monétaires standard avec 2 décimales (ex: 15.00 USD ou 42000.00 CDF).';
COMMENT ON COLUMN public.donations.provider_reference IS 'Identifiant unique de la transaction chez la passerelle (depositId PawaPay ou orderId/captureId PayPal) assurant l''idempotence.';

