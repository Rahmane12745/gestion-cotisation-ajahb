'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { StatCard } from './StatCard';
import { formatMoisFrancais, formatMontant, genererTexteRappel, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import {
  Wallet,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Share2,
  Calendar,
  MessageCircle,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  FileSpreadsheet
} from 'lucide-react';
import { MembreWithStats, Paiement } from '@/types';

interface MonthlyDashboardProps {
  onOpenPaymentModal: (defaultMemberId?: string) => void;
  onOpenMemberModal: () => void;
  onOpenExportModal: () => void;
  onViewReceipt: (paiement: Paiement) => void;
  onSelectMember: (membreId: string) => void;
}

export const MonthlyDashboard: React.FC<MonthlyDashboardProps> = ({
  onOpenPaymentModal,
  onOpenMemberModal,
  onOpenExportModal,
  onViewReceipt,
  onSelectMember,
}) => {
  const { stats, selectedMonth, setSelectedMonth, membresWithStats, paiements, devise, nomVillage, montantCotisation } = useData();
  const { canCollectPayments, canEditMembers } = useAuth();

  // Liste des mois disponibles (année courante)
  const currentYear = selectedMonth.split('-')[0] || '2026';
  const availableMonths = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
  ].map((m) => `${currentYear}-${m}`);

  // Membres en retard pour le mois sélectionné
  const retardMembres = membresWithStats.filter((m) => m.actif && !m.statutMoisCourant);
  const payesMembres = membresWithStats.filter((m) => m.actif && m.statutMoisCourant);

  // 5 derniers versements
  const recentPaiements = paiements.slice(0, 6);

  // Répartition par quartier
  const quartierStats = React.useMemo(() => {
    const map: Record<string, { total: number; payes: number }> = {};
    membresWithStats.forEach((m) => {
      const q = m.quartier || 'Non spécifié';
      if (!map[q]) map[q] = { total: 0, payes: 0 };
      map[q].total += 1;
      if (m.statutMoisCourant) map[q].payes += 1;
    });
    return Object.entries(map).map(([quartier, data]) => ({
      quartier,
      ...data,
      taux: data.total > 0 ? Math.round((data.payes / data.total) * 100) : 0,
    }));
  }, [membresWithStats]);

  const handleSendReminder = (membre: MembreWithStats) => {
    const text = genererTexteRappel(membre, selectedMonth, montantCotisation, devise, nomVillage);
    partagerSurWhatsApp(text, membre.telephone, `Rappel Cotisation ${membre.nom}`);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Selector and Title */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider">
            <Calendar className="w-4 h-4" /> Bilan Mensuel du Registre
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {formatMoisFrancais(selectedMonth)}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Suivi des encaissements et état des cotisations du village
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Choisir le mois :</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm cursor-pointer"
          >
            {availableMonths.map((mStr) => (
              <option key={mStr} value={mStr}>
                {formatMoisFrancais(mStr)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Cards Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title={`Collecte ${formatMoisFrancais(selectedMonth)}`}
          value={formatMontant(stats.totalCollecteMois, devise)}
          subtitle={`Objectif : ${formatMontant(stats.objectifMois, devise)}`}
          icon={Wallet}
          colorScheme="emerald"
          badgeText={`${stats.tauxRecouvrement}% de l'objectif`}
          badgeType={stats.tauxRecouvrement >= 70 ? 'success' : 'warning'}
        />

        <StatCard
          title="Taux de Recouvrement"
          value={`${stats.tauxRecouvrement}%`}
          subtitle={`${stats.membresPayesMois} sur ${stats.totalMembres} membres`}
          icon={TrendingUp}
          colorScheme="blue"
          badgeText={`${stats.membresPayesMois} cotisations reçues`}
          badgeType="info"
        />

        <StatCard
          title="Membres à jour ce mois"
          value={stats.membresPayesMois}
          subtitle="Ont réglé leur versement"
          icon={CheckCircle2}
          colorScheme="emerald"
          badgeText="À jour"
          badgeType="success"
        />

        <StatCard
          title="En attente de paiement"
          value={stats.membresEnRetardMois}
          subtitle={`Soit ${formatMontant(stats.membresEnRetardMois * montantCotisation, devise)} à recouvrer`}
          icon={Clock}
          colorScheme="rose"
          badgeText={`${stats.membresEnRetardMois} membres non payés`}
          badgeType="danger"
        />
      </div>

      {/* Recovery Progress Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-2">
          <span>Progression de la collecte ({formatMoisFrancais(selectedMonth)})</span>
          <span className="text-emerald-700 font-bold">{stats.tauxRecouvrement}% réalisé</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(5, stats.tauxRecouvrement))}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
          <span>{stats.membresPayesMois} membres ont versé ({formatMontant(stats.totalCollecteMois, devise)})</span>
          <span>Reste {stats.membresEnRetardMois} membres ({formatMontant(stats.membresEnRetardMois * montantCotisation, devise)})</span>
        </div>
      </div>

      {/* Main Grid: Pending Payments Alerts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Members with Late Payment (Actionable WhatsApp reminders) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Membres en attente de cotisation ({retardMembres.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Pour le mois de {formatMoisFrancais(selectedMonth)}
                  </p>
                </div>
              </div>
            </div>

            {retardMembres.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-800">Félicitations ! Tous les membres sont à jour ce mois-ci.</p>
                <p className="text-xs text-slate-500 mt-1">100% des cotisations ont été collectées.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
                {retardMembres.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 sm:p-4 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {m.matricule}
                        </span>
                        <button
                          onClick={() => onSelectMember(m.id)}
                          className="font-bold text-sm text-slate-800 hover:text-emerald-700 truncate text-left"
                        >
                          {m.nom}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>📞 {m.telephone}</span>
                        {m.quartier && <span className="hidden sm:inline">📍 {m.quartier}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSendReminder(m)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-sm"
                        title="Envoyer un rappel par WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Rappel WhatsApp</span>
                      </button>

                      {canCollectPayments && (
                        <button
                          onClick={() => onOpenPaymentModal(m.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                          <span>Encaisser</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breakdown by Neighborhood */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
            <h3 className="font-bold text-slate-900 text-base mb-3">
              Répartition par Quartier
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {quartierStats.map((q) => (
                <div key={q.quartier} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span className="truncate">{q.quartier}</span>
                    <span className="text-emerald-700 font-bold">{q.taux}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${q.taux}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1.5">
                    <span>{q.payes} / {q.total} payés</span>
                    <span>{q.total - q.payes} en attente</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Recent Transactions & Fast Actions */}
        <div className="space-y-6">
          {/* Fast Actions Box */}
          <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-5 text-white shadow-md">
            <h3 className="text-base font-bold mb-1">Raccourcis Rapides</h3>
            <p className="text-xs text-emerald-200 mb-4">
              Gérez les cotisations quotidiennes sans friction
            </p>

            <div className="space-y-2.5">
              {canCollectPayments && (
                <button
                  onClick={() => onOpenPaymentModal()}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-white text-emerald-900 font-bold text-sm shadow hover:bg-emerald-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    Enregistrer un Versement
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              {canEditMembers && (
                <button
                  onClick={onOpenMemberModal}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors border border-emerald-600/50"
                >
                  <span className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-300" />
                    Ajouter un Nouveau Membre
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={onOpenExportModal}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors border border-emerald-600/50"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-teal-300" />
                  Exporter le Bilan Excel / PDF
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recent Payments Stream */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm">
                Derniers Versements Enregistrés
              </h3>
            </div>

            <div className="space-y-3">
              {recentPaiements.map((p) => {
                const membre = membresWithStats.find((m) => m.id === p.membre_id);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {membre?.nom || 'Membre'}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-medium text-emerald-700">{formatMontant(p.montant, devise)}</span>
                        <span>•</span>
                        <span>{p.mois}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onViewReceipt(p)}
                      className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-100/60 border border-emerald-200 bg-white"
                      title="Voir et partager le reçu WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
