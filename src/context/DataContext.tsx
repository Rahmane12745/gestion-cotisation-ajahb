'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardStats, Membre, MembreWithStats, MonthPaymentStatus, Paiement } from '@/types';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS } from '@/lib/demoData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface DataContextType {
  membres: Membre[];
  paiements: Paiement[];
  membresWithStats: MembreWithStats[];
  stats: DashboardStats;
  selectedMonth: string; // 'AAAA-MM'
  setSelectedMonth: (month: string) => void;
  montantCotisation: number;
  devise: string;
  nomVillage: string;
  isLoading: boolean;
  addMembre: (data: { nom: string; telephone: string; quartier?: string; photo?: string }) => Promise<{ success: boolean; membre?: Membre; error?: string }>;
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
        if (mData) setMembres(mData);
        if (pData) setPaiements(pData);
      } else {
        const res = await fetch('/api/data');
        if (res.ok) {
          const json = await res.json();
          if (json.membres) setMembres(json.membres);
          if (json.paiements) setPaiements(json.paiements);
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

    const objectifMois = totalMembres * montantCotisation;

    return {
      totalMembres,
      membresPayesMois,
      membresEnRetardMois,
      tauxRecouvrement,
      totalCollecteMois,
      totalCollecteAnnee,
      objectifMois,
    };
  }, [membres, membresWithStats, paiements, selectedMonth, montantCotisation]);

  // Ajouter un membre
  const addMembre = async (data: { nom: string; telephone: string; quartier?: string; photo?: string }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const nextNumber = membres.length + 1;
        const matricule = `MBR-${String(nextNumber).padStart(4, '0')}`;
        const newMembre = {
          matricule,
          nom: data.nom.trim(),
          telephone: data.telephone.trim(),
          quartier: data.quartier?.trim() || 'Non spécifié',
          photo: data.photo,
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
    }
  };

  return (
    <DataContext.Provider
      value={{
        membres,
        paiements,
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
