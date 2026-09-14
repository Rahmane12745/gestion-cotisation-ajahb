import { Membre, Paiement, UserProfile, Depense } from '@/types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr-1',
    email: 'admin@ajahb.org',
    nom: 'Moussa Diallo (Président)',
    role: 'admin',
    actif: true,
    date_creation: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-2',
    email: 'tresorier@ajahb.org',
    nom: 'Amadou Sow (Trésorier)',
    role: 'tresorier',
    actif: true,
    date_creation: '2026-01-01T08:00:00Z',
  },
  {
    id: 'usr-3',
    email: 'bureau1@ajahb.org',
    nom: 'Fatou Ndiaye (Secrétaire)',
    role: 'membre_bureau',
    actif: true,
    date_creation: '2026-01-15T09:00:00Z',
  },
];

export const INITIAL_MEMBRES: Membre[] = [];

export const INITIAL_PAIEMENTS: Paiement[] = [];


export const INITIAL_DEPENSES: Depense[] = [];

