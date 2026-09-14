-- ====================================================================
-- REGISTRE NUMÉRIQUE DES COTISATIONS DU VILLAGE
-- Schéma de base de données Supabase (PostgreSQL)
-- ====================================================================

-- 1. Extension pour génération d'UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table des UTILISATEURS / PROFILS (Rôles d'accès)
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    nom TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tresorier', 'membre_bureau')),
    mot_de_passe TEXT DEFAULT 'ajahb2026',
    actif BOOLEAN DEFAULT true,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Séquence pour numéro matricule membre (ex: MBR-001)
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

-- 5. Table des PAIEMENTS (Cotisations)
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membre_id UUID NOT NULL REFERENCES public.membres(id) ON DELETE CASCADE,
    mois VARCHAR(7) NOT NULL, -- Format 'AAAA-MM' ex: '2026-09'
    montant NUMERIC(12, 2) NOT NULL CHECK (montant > 0),
    date_paiement TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    encaisseur TEXT NOT NULL,
    mode_paiement TEXT DEFAULT 'Espèces', -- 'Espèces', 'Wave', 'Orange Money', 'Virement'
    reference_recu TEXT,
    remarque TEXT,
    date_creation TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- Contrainte d'unicité optionnelle pour éviter double paiement du même mois par membre
-- Si un membre paie en 2 fois, on peut retirer cette contrainte ou autoriser plusieurs acomptes.
CREATE INDEX IF NOT EXISTS idx_paiements_membre_mois ON public.paiements(membre_id, mois);
CREATE INDEX IF NOT EXISTS idx_membres_recherche ON public.membres(nom, telephone, matricule);
CREATE INDEX IF NOT EXISTS idx_paiements_date ON public.paiements(date_paiement DESC);

-- ====================================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- Désactivé pour autoriser l'API frontend de l'application
-- ====================================================================

ALTER TABLE public.utilisateurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements DISABLE ROW LEVEL SECURITY;

-- ====================================================================
-- DONNÉES INITIALES DE DÉMARRAGE (3 COMPTES PAR DÉFAUT)
-- ====================================================================
-- Mots de passe par défaut : admin123, tresor123, bureau123
INSERT INTO public.utilisateurs (email, nom, role, mot_de_passe, actif)
VALUES 
  ('admin@ajahb.org', 'Moussa Diallo (Président)', 'admin', 'admin123', true),
  ('tresorier@ajahb.org', 'Amadou Sow (Trésorier)', 'tresorier', 'tresor123', true),
  ('bureau@ajahb.org', 'Fatou Ndiaye (Secrétaire)', 'membre_bureau', 'bureau123', true)
ON CONFLICT (email) DO NOTHING;
