'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardStats, Membre, MembreWithStats, MonthPaymentStatus, Paiement, Depense } from '@/types';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS, INITIAL_DEPENSES } from '@/lib/demoData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface DataContextType {
  membres: Membre[];
  paiements: Paiement[];
  depenses: Depense[];
  membresWithStats: MembreWithStats[];
  stats: DashboardStats;
  selectedMonth: string; // 'AAAA-MM'
  setSelectedMonth: (month: string) => void;
  montantCotisation: number;
  devise: string;
  nomVillage: string;
  isLoading: boolean;
  addMembre: (data: { nom: string; surnom?: string; telephone: string; quartier?: string; photo?: string }) => Promise<{ success: boolean; membre?: Membre; error?: string }>;
  updateMembre: (id: string, data: Partial<Membre>) => Promise<{ success: boolean; error?: string }>;
  deleteMembre: (id: string) => Promise<{ success: boolean; error?: string }>;
  addPaiement: (data: {
    membre_id: string;
    mois: string;
    montant: number;
    encaisseur: string;
    mode_paiement?: string;
    remarque?: string;
  }) => Promise<{ success: boolean; paiement?: Paiement; error?: string }>;
  deletePaiement: (id: string) => Promise<{ success: boolean; error?: string }>;
  addDepense: (data: {
    motif: string;
    montant: number;
    categorie?: string;
    enregistre_par: string;
    remarque?: string;
  }) => Promise<{ success: boolean; depense?: Depense; error?: string }>;
  deleteDepense: (id: string) => Promise<{ success: boolean; error?: string }>;
  getPaiementsForMembre: (membreId: string) => Paiement[];
  getMembreById: (id: string) => Membre | undefined;
  resetToDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const currentYearMonth = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth());
  const [membres, setMembres] = useState<Membre[]>(INITIAL_MEMBRES);
  const [paiements, setPaiements] = useState<Paiement[]>(INITIAL_PAIEMENTS);
  const [depenses, setDepenses] = useState<Depense[]>(INITIAL_DEPENSES);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const montantCotisation = Number(process.env.NEXT_PUBLIC_DEFAULT_COTISATION_AMOUNT) || 2000;
  const devise = process.env.NEXT_PUBLIC_CURRENCY || 'F';
  const nomVillage = process.env.NEXT_PUBLIC_VILLAGE_NAME || 'AJAHB';

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data: mData } = await supabase.from('membres').select('*').order('date_creation', { ascending: true });
        const { data: pData } = await supabase.from('paiements').select('*').order('date_paiement', { ascending: false });
        const { data: dData } = await supabase.from('depenses').select('*').order('date_depense', { ascending: false });
        if (mData) setMembres(mData);
        if (pData) setPaiements(pData);
        if (dData) setDepenses(dData);
      } else {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.membres) setMembres(json.membres);
          if (json.paiements) setPaiements(json.paiements);
          if (json.depenses) setDepenses(json.depenses);
        }
      }
    } catch (err) {
      console.error('Erreur chargement base de données:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calcul des membres enrichis avec historique et statuts
  const membresWithStats: MembreWithStats[] = useMemo(() => {
    const [currentYear] = selectedMonth.split('-');
    const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
      const monthNum = String(i + 1).padStart(2, '0');
      return `${currentYear}-${monthNum}`;
    });

    return membres.map((membre) => {
      const membrePaiements = paiements.filter((p) => p.membre_id === membre.id);
      const statutMoisCourant = membrePaiements.some((p) => p.mois === selectedMonth);

      const statutsMois: MonthPaymentStatus[] = monthsOfYear.map((mStr) => {
        const payRecord = membrePaiements.find((p) => p.mois === mStr);
        return {
          mois: mStr,
          paye: Boolean(payRecord),
          montant: payRecord?.montant,
          date_paiement: payRecord?.date_paiement,
          encaisseur: payRecord?.encaisseur,
        };
      });

      const montantPayeAnnee = membrePaiements
        .filter((p) => p.mois.startsWith(currentYear))
        .reduce((sum, p) => sum + Number(p.montant), 0);

      const moisPayesCount = membrePaiements.length;
      const currentMonthIndex = parseInt(selectedMonth.split('-')[1], 10);
      const moisPayesAnnee = statutsMois.slice(0, currentMonthIndex).filter((s) => s.paye).length;
      const moisEnRetardCount = Math.max(0, currentMonthIndex - moisPayesAnnee);

      return {
        ...membre,
        paiements: membrePaiements,
        statutMoisCourant,
        montantPayeAnnee,
        moisPayesCount,
        moisEnRetardCount,
        statutsMois,
      };
    });
  }, [membres, paiements, selectedMonth]);

  // Statistiques globales du tableau de bord
  const stats: DashboardStats = useMemo(() => {
    const totalMembres = membres.filter((m) => m.actif).length;
    const membresPayesMois = membresWithStats.filter((m) => m.actif && m.statutMoisCourant).length;
    const membresEnRetardMois = Math.max(0, totalMembres - membresPayesMois);
    const tauxRecouvrement = totalMembres > 0 ? Math.round((membresPayesMois / totalMembres) * 100) : 0;

    const paiementsMois = paiements.filter((p) => p.mois === selectedMonth);
    const totalCollecteMois = paiementsMois.reduce((acc, p) => acc + Number(p.montant), 0);

    const [currentYear] = selectedMonth.split('-');
    const paiementsAnnee = paiements.filter((p) => p.mois.startsWith(currentYear));
    const totalCollecteAnnee = paiementsAnnee.reduce((acc, p) => acc + Number(p.montant), 0);

    const depensesAnnee = depenses.filter((d) => d.date_depense && d.date_depense.startsWith(currentYear));
    const totalDepensesAnnee = depensesAnnee.reduce((acc, d) => acc + Number(d.montant), 0);

    const soldeNetCaisse = totalCollecteAnnee - totalDepensesAnnee;
    const objectifMois = totalMembres * montantCotisation;

    return {
      totalMembres,
      membresPayesMois,
      membresEnRetardMois,
      tauxRecouvrement,
      totalCollecteMois,
      totalCollecteAnnee,
      totalDepensesAnnee,
      soldeNetCaisse,
      objectifMois,
    };
  }, [membres, membresWithStats, paiements, depenses, selectedMonth, montantCotisation]);

  // Ajouter un membre
  const addMembre = async (data: { nom: string; surnom?: string; telephone: string; quartier?: string; photo?: string }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const nextNumber = membres.length + 1;
        const matricule = `MBR-${String(nextNumber).padStart(4, '0')}`;
        const newMembre = {
          matricule,
          nom: data.nom.trim(),
          surnom: data.surnom?.trim() || null,
          telephone: data.telephone.trim(),
          quartier: data.quartier?.trim() || 'Non spécifié',
          photo: data.photo || null,
          actif: true,
        };
        const { data: inserted, error } = await supabase.from('membres').insert([newMembre]).select().single();
        if (error) return { success: false, error: error.message };
        setMembres((prev) => [...prev, inserted]);
        return { success: true, membre: inserted };
      } else {
        const res = await fetch('/api/membres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          setMembres((prev) => [...prev, result.membre]);
          return { success: true, membre: result.membre };
        } else {
          return { success: false, error: result.error };
        }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau lors de l\'enregistrement' };
    }
  };

  // Modifier un membre
  const updateMembre = async (id: string, data: Partial<Membre>) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('membres').update(data).eq('id', id);
        if (error) return { success: false, error: error.message };
      } else {
        await fetch('/api/membres', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, ...data }),
        });
      }
      setMembres((prev) => prev.map((m) => (m.id === id ? { ...m, ...data } : m)));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la mise à jour' };
    }
  };

  // Supprimer un membre
  const deleteMembre = async (id: string) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('membres').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } else {
        await fetch(`/api/membres?id=${id}`, { method: 'DELETE' });
      }
      setMembres((prev) => prev.filter((m) => m.id !== id));
      setPaiements((prev) => prev.filter((p) => p.membre_id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  // Enregistrer un paiement
  const addPaiement = async (data: {
    membre_id: string;
    mois: string;
    montant: number;
    encaisseur: string;
    mode_paiement?: string;
    remarque?: string;
  }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const refNum = Math.floor(1000 + Math.random() * 9000);
        const reference_recu = `REC-${data.mois.replace('-', '')}-${refNum}`;
        const newPay = {
          membre_id: data.membre_id,
          mois: data.mois,
          montant: data.montant,
          encaisseur: data.encaisseur,
          mode_paiement: data.mode_paiement || 'Espèces',
          reference_recu,
          remarque: data.remarque,
        };
        const { data: inserted, error } = await supabase.from('paiements').insert([newPay]).select().single();
        if (error) return { success: false, error: error.message };
        setPaiements((prev) => [inserted, ...prev]);
        return { success: true, paiement: inserted };
      } else {
        const res = await fetch('/api/paiements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await res.json();
        if (result.success) {
          setPaiements((prev) => [result.paiement, ...prev]);
          return { success: true, paiement: result.paiement };
        } else {
          return { success: false, error: result.error };
        }
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau lors de l\'encaissement' };
    }
  };

  // Supprimer un versement
  const deletePaiement = async (id: string) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('paiements').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } else {
        await fetch(`/api/paiements?id=${id}`, { method: 'DELETE' });
      }
      setPaiements((prev) => prev.filter((p) => p.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  // Enregistrer une dépense
  const addDepense = async (data: {
    motif: string;
    montant: number;
    categorie?: string;
    enregistre_par: string;
    remarque?: string;
  }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const newDep = {
          motif: data.motif.trim(),
          montant: data.montant,
          categorie: data.categorie?.trim() || 'Général',
          enregistre_par: data.enregistre_par,
          remarque: data.remarque?.trim() || null,
        };
        const { data: inserted, error } = await supabase.from('depenses').insert([newDep]).select().single();
        if (error) return { success: false, error: error.message };
        setDepenses((prev) => [inserted, ...prev]);
        return { success: true, depense: inserted };
      } else {
        const newDepense: Depense = {
          id: `dep-${Date.now()}`,
          motif: data.motif.trim(),
          montant: data.montant,
          date_depense: new Date().toISOString(),
          categorie: data.categorie?.trim() || 'Général',
          enregistre_par: data.enregistre_par,
          remarque: data.remarque?.trim(),
        };
        setDepenses((prev) => [newDepense, ...prev]);
        return { success: true, depense: newDepense };
      }
    } catch (err) {
      return { success: false, error: 'Erreur réseau lors de la saisie de la dépense' };
    }
  };

  // Supprimer une dépense
  const deleteDepense = async (id: string) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('depenses').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      }
      setDepenses((prev) => prev.filter((d) => d.id !== id));
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression de la dépense' };
    }
  };

  const getPaiementsForMembre = (membreId: string) => {
    return paiements.filter((p) => p.membre_id === membreId);
  };

  const getMembreById = (id: string) => {
    return membres.find((m) => m.id === id);
  };

  const resetToDemoData = async () => {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });
      await loadData();
    } catch (err) {
      setMembres(INITIAL_MEMBRES);
      setPaiements(INITIAL_PAIEMENTS);
      setDepenses(INITIAL_DEPENSES);
    }
  };

  return (
    <DataContext.Provider
      value={{
        membres,
        paiements,
        depenses,
        membresWithStats,
        stats,
        selectedMonth,
        setSelectedMonth,
        montantCotisation,
        devise,
        nomVillage,
        isLoading,
        addMembre,
        updateMembre,
        deleteMembre,
        addPaiement,
        deletePaiement,
        addDepense,
        deleteDepense,
        getPaiementsForMembre,
        getMembreById,
        resetToDemoData,
        refreshData: loadData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
