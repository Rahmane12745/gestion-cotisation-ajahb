'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DashboardStats, Membre, MembreWithStats, MonthPaymentStatus, Paiement, Depense, ProjetSpecial, CotisationProjet } from '@/types';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS, INITIAL_DEPENSES } from '@/lib/demoData';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

interface DataContextType {
  membres: Membre[];
  paiements: Paiement[];
  depenses: Depense[];
  projetsSpeciaux: ProjetSpecial[];
  cotisationsProjets: CotisationProjet[];
  membresWithStats: MembreWithStats[];
  stats: DashboardStats;
  selectedMonth: string; // 'AAAA-MM'
  setSelectedMonth: (month: string) => void;
  montantCotisation: number;
  devise: string;
  nomVillage: string;
  isLoading: boolean;
  offlinePendingCount: number;
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
  addProjetSpecial: (data: { titre: string; description?: string; objectif_montant: number }) => Promise<{ success: boolean; error?: string }>;
  deleteProjetSpecial: (id: string) => Promise<{ success: boolean; error?: string }>;
  addCotisationProjet: (data: { projet_id: string; membre_id: string; montant: number; encaisseur: string; mode_paiement?: string }) => Promise<{ success: boolean; error?: string }>;
  getPaiementsForMembre: (membreId: string) => Paiement[];
  getMembreById: (id: string) => Membre | undefined;
  resetToDemoData: () => Promise<void>;
  refreshData: () => Promise<void>;
  syncOfflineQueue: () => Promise<void>;
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

  const [projetsSpeciaux, setProjetsSpeciaux] = useState<ProjetSpecial[]>([]);
  const [cotisationsProjets, setCotisationsProjets] = useState<CotisationProjet[]>([]);
  const [offlinePendingCount, setOfflinePendingCount] = useState<number>(0);

  // Synchronisation des paiements hors-ligne enregistrés en local
  const syncOfflineQueue = async () => {
    try {
      const raw = localStorage.getItem('ajahb_offline_paiements');
      if (!raw) return;
      const queue = JSON.parse(raw);
      if (!Array.isArray(queue) || queue.length === 0) return;

      if (isSupabaseConfigured() && supabase) {
        for (const payData of queue) {
          await supabase.from('paiements').insert([payData]);
        }
      }
      localStorage.removeItem('ajahb_offline_paiements');
      setOfflinePendingCount(0);
      await loadData();
    } catch (err) {
      console.error('Erreur lors de la sync hors-ligne:', err);
    }
  };

  const saveToOfflineQueue = (payData: any) => {
    try {
      const raw = localStorage.getItem('ajahb_offline_paiements');
      const queue = raw ? JSON.parse(raw) : [];
      queue.push(payData);
      localStorage.setItem('ajahb_offline_paiements', JSON.stringify(queue));
      setOfflinePendingCount(queue.length);
    } catch (err) {
      console.error('Erreur sauvegarde hors-ligne:', err);
    }
  };

  const loadProjetsSpeciaux = async () => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { data: pData } = await supabase.from('projets_speciaux').select('*').order('date_creation', { ascending: false });
        const { data: cData } = await supabase.from('cotisations_projets').select('*').order('date_paiement', { ascending: false });
        if (pData) setProjetsSpeciaux(pData);
        if (cData) setCotisationsProjets(cData);
      }
    } catch (err) {
      console.error('Erreur chargement projets spéciaux:', err);
    }
  };

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
        await loadProjetsSpeciaux();
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
    const checkOfflineCount = () => {
      try {
        const raw = localStorage.getItem('ajahb_offline_paiements');
        if (raw) {
          const queue = JSON.parse(raw);
          if (Array.isArray(queue)) setOfflinePendingCount(queue.length);
        }
      } catch (e) {}
    };

    checkOfflineCount();
    loadData();

    const handleOnline = () => {
      syncOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  // Enregistrer un paiement (avec support offline auto)
  const addPaiement = async (data: {
    membre_id: string;
    mois: string;
    montant: number;
    encaisseur: string;
    mode_paiement?: string;
    remarque?: string;
  }) => {
    const refNum = Math.floor(1000 + Math.random() * 9000);
    const reference_recu = `REC-${data.mois.replace('-', '')}-${refNum}`;
    const newPay = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pay-${Date.now()}`,
      membre_id: data.membre_id,
      mois: data.mois,
      montant: data.montant,
      date_paiement: new Date().toISOString(),
      encaisseur: data.encaisseur,
      mode_paiement: data.mode_paiement || 'Espèces',
      reference_recu,
      remarque: data.remarque,
    };

    if (!navigator.onLine) {
      // Hors-ligne
      saveToOfflineQueue(newPay);
      setPaiements((prev) => [newPay as Paiement, ...prev]);
      return { success: true, paiement: newPay as Paiement };
    }

    try {
      if (isSupabaseConfigured() && supabase) {
        const { data: inserted, error } = await supabase.from('paiements').insert([{
          membre_id: data.membre_id,
          mois: data.mois,
          montant: data.montant,
          encaisseur: data.encaisseur,
          mode_paiement: data.mode_paiement || 'Espèces',
          reference_recu,
          remarque: data.remarque,
        }]).select().single();
        if (error) {
          saveToOfflineQueue(newPay);
          setPaiements((prev) => [newPay as Paiement, ...prev]);
          return { success: true, paiement: newPay as Paiement };
        }
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
      saveToOfflineQueue(newPay);
      setPaiements((prev) => [newPay as Paiement, ...prev]);
      return { success: true, paiement: newPay as Paiement };
    }
  };

  // Créer un projet spécial
  const addProjetSpecial = async (data: { titre: string; description?: string; objectif_montant: number }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('projets_speciaux').insert([{
          titre: data.titre,
          description: data.description,
          objectif_montant: data.objectif_montant,
          collecte_actuelle: 0,
          statut: 'en_cours',
        }]);
        if (error) return { success: false, error: error.message };
        await loadProjetsSpeciaux();
        return { success: true };
      } else {
        const newProj: ProjetSpecial = {
          id: `proj-${Date.now()}`,
          titre: data.titre,
          description: data.description,
          objectif_montant: data.objectif_montant,
          collecte_actuelle: 0,
          statut: 'en_cours',
        };
        setProjetsSpeciaux((prev) => [newProj, ...prev]);
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: 'Erreur lors de la création du projet' };
    }
  };

  // Supprimer un projet spécial / collecte
  const deleteProjetSpecial = async (id: string) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        // Supprimer d'abord les cotisations associées au projet
        await supabase.from('cotisations_projets').delete().eq('projet_id', id);
        // Supprimer le projet
        const { error } = await supabase.from('projets_speciaux').delete().eq('id', id);
        if (error) return { success: false, error: error.message };
        await loadProjetsSpeciaux();
        return { success: true };
      } else {
        setCotisationsProjets((prev) => prev.filter((c) => c.projet_id !== id));
        setProjetsSpeciaux((prev) => prev.filter((p) => p.id !== id));
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: 'Erreur lors de la suppression de la collecte' };
    }
  };

  // Versement sur projet spécial
  const addCotisationProjet = async (data: { projet_id: string; membre_id: string; montant: number; encaisseur: string; mode_paiement?: string }) => {
    try {
      if (isSupabaseConfigured() && supabase) {
        const { error } = await supabase.from('cotisations_projets').insert([{
          projet_id: data.projet_id,
          membre_id: data.membre_id,
          montant: data.montant,
          encaisseur: data.encaisseur,
          mode_paiement: data.mode_paiement || 'Espèces',
        }]);
        if (error) return { success: false, error: error.message };

        // Mettre à jour la collecte du projet
        const proj = projetsSpeciaux.find((p) => p.id === data.projet_id);
        if (proj) {
          const nouvelleCollecte = Number(proj.collecte_actuelle) + Number(data.montant);
          await supabase.from('projets_speciaux').update({ collecte_actuelle: nouvelleCollecte }).eq('id', data.projet_id);
        }

        await loadProjetsSpeciaux();
        return { success: true };
      } else {
        const newCot: CotisationProjet = {
          id: `cotp-${Date.now()}`,
          projet_id: data.projet_id,
          membre_id: data.membre_id,
          montant: data.montant,
          date_paiement: new Date().toISOString(),
          encaisseur: data.encaisseur,
          mode_paiement: data.mode_paiement,
        };
        setCotisationsProjets((prev) => [newCot, ...prev]);
        setProjetsSpeciaux((prev) =>
          prev.map((p) => (p.id === data.projet_id ? { ...p, collecte_actuelle: Number(p.collecte_actuelle) + Number(data.montant) } : p))
        );
        return { success: true };
      }
    } catch (err) {
      return { success: false, error: 'Erreur versement projet' };
    }
  };

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
      // Trouver le matricule numérique maximum pour éviter tout conflit
      const maxNumber = membres.reduce((max, m) => {
        const num = parseInt((m.matricule || '').replace(/[^0-9]/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 0);
      const nextNumber = maxNumber + 1;
      const matricule = `MBR-${String(nextNumber).padStart(4, '0')}`;

      if (isSupabaseConfigured() && supabase) {
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
        if (error) {
          // En cas de conflit de matricule existant, générer un matricule garanti unique avec timestamp
          const uniqueMatriculeFallback = `MBR-${Date.now().toString().slice(-6)}`;
          const fallbackMembre = {
            matricule: uniqueMatriculeFallback,
            nom: data.nom.trim(),
            surnom: data.surnom?.trim() || null,
            telephone: data.telephone.trim(),
            quartier: data.quartier?.trim() || 'Non spécifié',
            photo: data.photo || null,
            actif: true,
          };
          const { data: insertedFallback, error: fallbackError } = await supabase.from('membres').insert([fallbackMembre]).select().single();
          if (fallbackError) {
            return { success: false, error: fallbackError.message };
          }
          setMembres((prev) => [...prev, insertedFallback]);
          return { success: true, membre: insertedFallback };
        }
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

  // Enregistrer une dépense avec vérification du solde de caisse (style Wave)
  const addDepense = async (data: {
    motif: string;
    montant: number;
    categorie?: string;
    enregistre_par: string;
    remarque?: string;
  }) => {
    try {
      if (data.montant > stats.soldeNetCaisse) {
        return {
          success: false,
          error: `Solde insuffisant en caisse ! Le solde disponible est de ${stats.soldeNetCaisse.toLocaleString('fr-FR')} ${devise}. Impossible d'effectuer une dépense supérieure au solde.`,
        };
      }

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
        projetsSpeciaux,
        cotisationsProjets,
        membresWithStats,
        stats,
        selectedMonth,
        setSelectedMonth,
        montantCotisation,
        devise,
        nomVillage,
        isLoading,
        offlinePendingCount,
        addMembre,
        updateMembre,
        deleteMembre,
        addPaiement,
        deletePaiement,
        addDepense,
        deleteDepense,
        addProjetSpecial,
        deleteProjetSpecial,
        addCotisationProjet,
        getPaiementsForMembre,
        getMembreById,
        resetToDemoData,
        refreshData: loadData,
        syncOfflineQueue,
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
