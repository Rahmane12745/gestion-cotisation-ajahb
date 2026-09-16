export type UserRole = 'admin' | 'tresorier' | 'membre_bureau';

export interface UserProfile {
  id: string;
  email: string;
  nom: string;
  role: UserRole;
  actif: boolean;
  photo?: string;
  mot_de_passe?: string;
  date_creation?: string;
}

export interface Membre {
  id: string;
  matricule: string;
  nom: string;
  surnom?: string;
  telephone: string;
  quartier?: string;
  photo?: string;
  sanction?: string;
  sanction_montant?: number;
  actif: boolean;
  date_creation: string;
}

export type ModePaiement = 'Esp\u00e8ces' | 'Wave' | 'Orange Money' | 'Virement' | 'Ch\u00e8que';

export interface Paiement {
  id: string;
  membre_id: string;
  mois: string; // Format 'AAAA-MM' e.g. '2026-09'
  montant: number;
  date_paiement: string;
  encaisseur: string;
  mode_paiement?: ModePaiement;
  reference_recu?: string;
  remarque?: string;
  date_creation?: string;
  membre?: Membre;
}

export interface Depense {
  id: string;
  motif: string;
  montant: number;
  date_depense: string;
  categorie?: string;
  enregistre_par: string;
  remarque?: string;
  date_creation?: string;
}

export interface MonthPaymentStatus {
  mois: string;
  paye: boolean;
  montant?: number;
  date_paiement?: string;
  encaisseur?: string;
}

export interface MembreWithStats extends Membre {
  paiements: Paiement[];
  statutMoisCourant: boolean;
  montantPayeAnnee: number;
  moisPayesCount: number;
  moisEnRetardCount: number;
  statutsMois: MonthPaymentStatus[];
}

export interface DashboardStats {
  totalMembres: number;
  membresPayesMois: number;
  membresEnRetardMois: number;
  tauxRecouvrement: number;
  totalCollecteMois: number;
  totalCollecteAnnee: number;
  totalDepensesAnnee: number;
  soldeNetCaisse: number;
  objectifMois: number;
}
