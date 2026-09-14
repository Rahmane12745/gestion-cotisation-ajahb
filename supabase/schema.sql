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
    telephone TEXT NOT NULL,
    quartier TEXT,
    photo TEXT,
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
-- ====================================================================

ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membres ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;

-- Helper function pour obtenir le rôle de l'utilisateur connecté via Supabase Auth
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.utilisateurs WHERE email = auth.email() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- Politiques pour la table 'utilisateurs' :
-- Tout utilisateur connecté peut lire les profils
CREATE POLICY "Lecture utilisateurs pour membres connectés"
    ON public.utilisateurs FOR SELECT
    USING (auth.role() = 'authenticated');

-- Seul l'admin peut créer, modifier ou supprimer des utilisateurs
CREATE POLICY "Gestion utilisateurs réservée aux admins"
    ON public.utilisateurs FOR ALL
    USING (public.get_user_role() = 'admin');

-- Politiques pour la table 'membres' :
-- Tous les rôles connectés peuvent consulter les membres
CREATE POLICY "Lecture membres pour tous"
    ON public.membres FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admin et Trésorier peuvent insérer ou modifier des membres
CREATE POLICY "Modification membres pour admin et trésorier"
    ON public.membres FOR INSERT
    WITH CHECK (public.get_user_role() IN ('admin', 'tresorier'));

CREATE POLICY "Mise à jour membres pour admin et trésorier"
    ON public.membres FOR UPDATE
    USING (public.get_user_role() IN ('admin', 'tresorier'));

-- Seul l'admin peut supprimer un membre
CREATE POLICY "Suppression membres réservée à l'admin"
    ON public.membres FOR DELETE
    USING (public.get_user_role() = 'admin');

-- Politiques pour la table 'paiements' :
-- Tous les rôles peuvent consulter l'historique des paiements
CREATE POLICY "Lecture paiements pour tous"
    ON public.paiements FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admin et Trésorier peuvent enregistrer des paiements
CREATE POLICY "Enregistrement paiements pour admin et trésorier"
    ON public.paiements FOR INSERT
    WITH CHECK (public.get_user_role() IN ('admin', 'tresorier'));

-- Seul l'admin peut supprimer ou modifier un paiement existant (intégrité comptable)
CREATE POLICY "Modification suppression paiements réservée à l'admin"
    ON public.paiements FOR UPDATE
    USING (public.get_user_role() = 'admin');

CREATE POLICY "Suppression paiements réservée à l'admin"
    ON public.paiements FOR DELETE
    USING (public.get_user_role() = 'admin');

-- ====================================================================
-- DONNÉES INITIALES DE DÉMARRAGE (ADMIN PAR DÉFAUT)
-- ====================================================================
INSERT INTO public.utilisateurs (email, nom, role)
VALUES ('admin@village.org', 'Administrateur Général', 'admin')
ON CONFLICT (email) DO NOTHING;
