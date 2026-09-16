'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatMoisFrancais, formatMontant, genererTexteRappel, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import {
  Search,
  Check,
  MessageCircle,
  Eye,
  EyeOff,
  ChevronRight,
  WifiOff,
  BarChart3,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';
import { MembreWithStats, Paiement } from '@/types';

interface WaveDashboardProps {
  onOpenPayment: (defaultMemberId?: string) => void;
  onSelectMember: (m: MembreWithStats) => void;
  onViewReceipt: (paiement: Paiement) => void;
}

export const WaveDashboard: React.FC<WaveDashboardProps> = ({
  onOpenPayment,
  onSelectMember,
  onViewReceipt,
}) => {
  const { stats, selectedMonth, setSelectedMonth, membresWithStats, paiements, devise, nomVillage, montantCotisation, offlinePendingCount, syncOfflineQueue } = useData();
  const { canCollectPayments } = useAuth();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'late' | 'paid'>('all');
  const [showBalance, setShowBalance] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncOffline = async () => {
    setIsSyncing(true);
    await syncOfflineQueue();
    setIsSyncing(false);
  };

  const currentYear = selectedMonth.split('-')[0] || '2026';
  const monthsShort = [
    { num: '01', name: 'Jan' },
    { num: '02', name: 'Fév' },
    { num: '03', name: 'Mar' },
    { num: '04', name: 'Avr' },
    { num: '05', name: 'Mai' },
    { num: '06', name: 'Juin' },
    { num: '07', name: 'Juil' },
    { num: '08', name: 'Août' },
    { num: '09', name: 'Sep' },
    { num: '10', name: 'Oct' },
    { num: '11', name: 'Nov' },
    { num: '12', name: 'Déc' },
  ];

  // Filtrage ultra-rapide
  const filteredMembres = useMemo(() => {
    return membresWithStats.filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(search.toLowerCase()) ||
        m.telephone.includes(search) ||
        m.matricule.toLowerCase().includes(search.toLowerCase()) ||
        (m.quartier && m.quartier.toLowerCase().includes(search.toLowerCase()));

      const matchFilter =
        filter === 'all'
          ? true
          : filter === 'late'
          ? !m.statutMoisCourant
          : m.statutMoisCourant;

      return matchSearch && matchFilter;
    });
  }, [membresWithStats, search, filter]);

  const handleSendReminder = (e: React.MouseEvent, m: MembreWithStats) => {
    e.stopPropagation();
    const text = genererTexteRappel(m, selectedMonth, montantCotisation, devise, nomVillage);
    partagerSurWhatsApp(text, m.telephone, `Rappel ${m.nom}`);
  };

  const handleDirectPay = (e: React.MouseEvent, memberId: string) => {
    e.stopPropagation();
    onOpenPayment(memberId);
  };

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 sm:pb-8 animate-slideUp">
      {/* 1. Hero Balance Card - Slate/Emerald 2-Color Design */}
      <div className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border border-emerald-500/20">
        {/* Subtle glass glow accents */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header: Month Tag */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            {formatMoisFrancais(selectedMonth)}
          </span>
        </div>

        {/* Balance Amount with Show/Hide toggle */}
        <div className="my-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-emerald-100/90 font-medium">
              <span>Solde Net en Caisse</span>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="text-emerald-200/80 hover:text-white transition-colors"
              >
                {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
            {stats.totalDepensesAnnee > 0 && (
              <span className="text-[10px] text-emerald-100 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
                Dépenses: -{formatMontant(stats.totalDepensesAnnee, devise)}
              </span>
            )}
          </div>

          <div className="text-3xl sm:text-4xl font-black tracking-tight mt-0.5 flex items-baseline gap-2">
            <span>{showBalance ? formatMontant(stats.soldeNetCaisse, devise) : '••••••••'}</span>
          </div>

          <div className="text-[11px] text-emerald-100/80 mt-1 font-medium flex items-center gap-1">
            <span>Cotisations collectées:</span>
            <strong className="text-white">{showBalance ? formatMontant(stats.totalCollecteMois, devise) : '••••'}</strong>
          </div>
        </div>

        {/* Horizontal Mini Month Carousel */}
        <div className="mt-4 pt-3 border-t border-emerald-500/30">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {monthsShort.map((m) => {
              const mStr = `${currentYear}-${m.num}`;
              const isSelected = selectedMonth === mStr;
              return (
                <button
                  key={m.num}
                  onClick={() => setSelectedMonth(mStr)}
                  className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-white text-emerald-900 shadow-md font-black scale-105'
                      : 'bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Progress Footer */}
        <div className="mt-3 pt-3 border-t border-emerald-500/30 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <span className="text-emerald-100">
              <strong>{stats.membresPayesMois}</strong> / {stats.totalMembres} membres à jour
            </span>
          </div>
          <span className="bg-emerald-400/20 text-emerald-100 font-extrabold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-400/30">
            {stats.tauxRecouvrement}% réalisé
          </span>
        </div>
      </div>

      {/* Offline Pending Sync Banner */}
      {offlinePendingCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-between gap-2 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-xs font-black">{offlinePendingCount} paiement(s) enregistrés hors-ligne</p>
              <p className="text-[11px] text-amber-700 font-medium">Ils seront synchronisés automatiquement dès que le réseau revient.</p>
            </div>
          </div>
          <button
            onClick={handleSyncOffline}
            disabled={isSyncing}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs flex items-center gap-1 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync</span>
          </button>
        </div>
      )}

      {/* 2. Visual Financial Charts & Performance Card */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-800">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">Aperçu Visuel des Cotisations</h3>
          </div>
          <span className="text-[10px] text-slate-400 font-bold">Année {currentYear}</span>
        </div>

        {/* CSS Visual Bar Chart */}
        <div className="space-y-2">
          {/* Taux de recouvrement bar */}
          <div>
            <div className="flex justify-between text-xs font-bold mb-1">
              <span className="text-slate-600">Taux de recouvrement ({formatMoisFrancais(selectedMonth)})</span>
              <span className="text-emerald-600 font-black">{stats.tauxRecouvrement}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/60">
              <div
                className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.max(5, stats.tauxRecouvrement)}%` }}
              />
            </div>
          </div>

          {/* Recettes vs Dépenses comparatif */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
            <div className="p-2.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
              <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-600" /> Total Recettes
              </div>
              <div className="text-sm font-black text-emerald-950 mt-0.5">
                {formatMontant(stats.totalCollecteAnnee, devise)}
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <BarChart3 className="w-3 h-3 text-slate-500" /> Total Dépenses
              </div>
              <div className="text-sm font-black text-slate-800 mt-0.5">
                {formatMontant(stats.totalDepensesAnnee, devise)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sleek Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone, quartier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-slate-200/90 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm transition-all placeholder:text-slate-400"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* 3. Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs font-bold p-1 bg-slate-200/60 rounded-2xl">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2 rounded-xl transition-all text-center ${
            filter === 'all'
              ? 'bg-white text-slate-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Tous ({membresWithStats.length})
        </button>

        <button
          onClick={() => setFilter('late')}
          className={`flex-1 py-2 rounded-xl transition-all text-center ${
            filter === 'late'
              ? 'bg-emerald-800 text-white shadow-sm font-black'
              : 'text-slate-700 hover:bg-slate-100'
          }`}
        >
          En attente ({membresWithStats.filter((m) => !m.statutMoisCourant).length})
        </button>

        <button
          onClick={() => setFilter('paid')}
          className={`flex-1 py-2 rounded-xl transition-all text-center ${
            filter === 'paid'
              ? 'bg-emerald-600 text-white shadow-sm font-black'
              : 'text-emerald-800 hover:bg-emerald-50'
          }`}
        >
          Payés ({membresWithStats.filter((m) => m.statutMoisCourant).length})
        </button>
      </div>

      {/* 4. Top-Tier Member Feed */}
      <div className="space-y-2.5">
        {filteredMembres.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-slate-200 shadow-sm">
            Aucun membre trouvé pour ce filtre.
          </div>
        ) : (
          filteredMembres.map((m) => {
            const isPaid = m.statutMoisCourant;
            const currentPayment = paiements.find((p) => p.membre_id === m.id && p.mois === selectedMonth);

            return (
              <div
                key={m.id}
                onClick={() => onSelectMember(m)}
                className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] group"
              >
                {/* Member Avatar + Info */}
                <div className="flex items-center gap-3 min-w-0">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.nom}
                      className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 border border-slate-200/80"
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm transition-transform group-hover:scale-105 ${
                        isPaid
                          ? 'bg-gradient-to-tr from-emerald-600 to-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.nom.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-extrabold text-sm text-slate-900 truncate">
                        {m.nom}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                        {m.matricule}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {m.telephone} {m.quartier ? `• ${m.quartier}` : ''}
                    </p>
                  </div>
                </div>

                {/* Right Direct Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isPaid ? (
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Payé
                      </span>

                      {currentPayment && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewReceipt(currentPayment);
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          title="Voir le reçu WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleSendReminder(e, m)}
                        className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        title="Envoyer un rappel WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                      </button>

                      {canCollectPayments && (
                        <button
                          onClick={(e) => handleDirectPay(e, m.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1"
                        >
                          <span>Encaisser</span>
                        </button>
                      )}
                    </div>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-600 transition-colors hidden sm:block" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
