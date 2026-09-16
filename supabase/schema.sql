-- ====================================================================
-- REGISTRE NUMÉRIQUE DES COTISATIONS DU VILLAGE (AJAHB)
-- Schéma de base de données Supabase (PostgreSQL)
-- ====================================================================

-- 1. Extension pour génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table des UTILISATEURS / PROFILS (Rôles d'accès)
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tresorier', 'membre_bureau', 'membre')),
    mot_de_passe TEXT DEFAULT 'ajahb2026',
    photo TEXT,
    membre_id UUID REFERENCES public.membres(id) ON DELETE SET NULL,
    actif BOOLEAN DEFAULT true,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS mot_de_passe TEXT DEFAULT 'ajahb2026';
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS photo TEXT;
ALTER TABLE public.utilisateurs ADD COLUMN IF NOT EXISTS membre_id UUID REFERENCES public.membres(id) ON DELETE SET NULL;
ALTER TABLE public.utilisateurs DROP CONSTRAINT IF EXISTS utilisateurs_role_check;
ALTER TABLE public.utilisateurs ADD CONSTRAINT utilisateurs_role_check CHECK (role IN ('admin', 'tresorier', 'membre_bureau', 'membre'));

-- 3. Séquence pour numéro matricule membre (ex: MBR-0001)
CREATE SEQUENCE IF NOT EXISTS membre_seq START 1;

-- 4. Table des MEMBRES
CREATE TABLE IF NOT EXISTS public.membres (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    matricule TEXT UNIQUE NOT NULL DEFAULT ('MBR-' || LPAD(nextval('membre_seq')::TEXT, 4, '0')),
    nom TEXT NOT NULL,
    surnom TEXT,
    telephone TEXT NOT NULL,
    quartier TEXT,
    photo TEXT,
    sanction TEXT,
    sanction_montant NUMERIC(12, 2) DEFAULT 0,
    actif BOOLEAN DEFAULT true,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.membres ADD COLUMN IF NOT EXISTS surnom TEXT;
ALTER TABLE public.membres ADD COLUMN IF NOT EXISTS sanction TEXT;
ALTER TABLE public.membres ADD COLUMN IF NOT EXISTS sanction_montant NUMERIC(12, 2) DEFAULT 0;

-- 5. Table des PAIEMENTS (Cotisations)
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membre_id UUID NOT NULL REFERENCES public.membres(id) ON DELETE CASCADE,
    mois VARCHAR(7) NOT NULL, -- Format 'AAAA-MM' ex: '2026-09'
    montant NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
    date_paiement TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    encaisseur TEXT NOT NULL,
    mode_paiement TEXT DEFAULT 'Espèces',
    reference_recu TEXT,
    remarque TEXT,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Table des DÉPENSES DU VILLAGE
CREATE TABLE IF NOT EXISTS public.depenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    motif TEXT NOT NULL,
    montant NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
    date_depense TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    categorie TEXT DEFAULT 'Général',
    enregistre_par TEXT NOT NULL,
    remarque TEXT,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_depenses_date ON public.depenses(date_depense DESC);

-- ====================================================================
-- ACTIVATION RLS AVEC POLITIQUES ACCÈS PUBLIC
-- ====================================================================

ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.depenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public utilisateurs" ON public.utilisateurs;
CREATE POLICY "Allow public utilisateurs" ON public.utilisateurs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public membres" ON public.membres;
CREATE POLICY "Allow public membres" ON public.membres FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public paiements" ON public.paiements;
CREATE POLICY "Allow public paiements" ON public.paiements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public depenses" ON public.depenses;
CREATE POLICY "Allow public depenses" ON public.depenses FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- DONNÉES INITIALES DE DÉMARRAGE
-- ====================================================================
INSERT INTO public.utilisateurs (email, nom, role, mot_de_passe, actif)
VALUES 
  ('admin@ajahb.org', 'Moussa Diallo (Président)', 'admin', 'admin123', true),
  ('tresorier@ajahb.org', 'Amadou Sow (Trésorier)', 'tresorier', 'tresor123', true),
  ('bureau@ajahb.org', 'Fatou Ndiaye (Secrétaire)', 'membre_bureau', 'bureau123', true)
ON CONFLICT (email) DO NOTHING;
