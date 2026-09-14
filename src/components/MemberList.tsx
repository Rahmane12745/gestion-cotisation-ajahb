'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { MembreWithStats, Paiement } from '@/types';
import { formatMoisFrancais, formatMontant, genererTexteRappel, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import {
  Search,
  Filter,
  PlusCircle,
  Phone,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  MoreVertical,
  Edit2,
  Trash2,
  CreditCard,
  MessageCircle,
  Calendar,
  UserCheck
} from 'lucide-react';

interface MemberListProps {
  onOpenPaymentModal: (memberId: string) => void;
  onOpenMemberModal: (memberToEdit?: MembreWithStats) => void;
  onViewReceipt: (paiement: Paiement) => void;
  selectedMemberId?: string | null;
  onSelectMember: (memberId: string | null) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  onOpenPaymentModal,
  onOpenMemberModal,
  onViewReceipt,
  selectedMemberId,
  onSelectMember,
}) => {
  const { membresWithStats, selectedMonth, devise, montantCotisation, nomVillage, deleteMembre } = useData();
  const { canCollectPayments, canEditMembers, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'late'>('all');
  const [selectedQuartier, setSelectedQuartier] = useState<string>('all');
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Liste unique des quartiers
  const quartiers = useMemo(() => {
    const set = new Set<string>();
    membresWithStats.forEach((m) => {
      if (m.quartier) set.add(m.quartier);
    });
    return Array.from(set);
  }, [membresWithStats]);

  // Filtrage multi-critères
  const filteredMembres = useMemo(() => {
    return membresWithStats.filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.telephone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.quartier && m.quartier.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'paid'
          ? m.statutMoisCourant
          : !m.statutMoisCourant;

      const matchQuartier =
        selectedQuartier === 'all' || m.quartier === selectedQuartier;

      return matchSearch && matchStatus && matchQuartier;
    });
  }, [membresWithStats, searchQuery, filterStatus, selectedQuartier]);

  const handleSendReminder = (membre: MembreWithStats) => {
    const text = genererTexteRappel(membre, selectedMonth, montantCotisation, devise, nomVillage);
    partagerSurWhatsApp(text, membre.telephone, `Rappel Cotisation ${membre.nom}`);
  };

  const handleDelete = async (id: string, nom: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le membre "${nom}" et tout son historique de cotisations ?`)) {
      await deleteMembre(id);
      if (selectedMemberId === id) onSelectMember(null);
    }
  };

  const selectedMember = membresWithStats.find((m) => m.id === selectedMemberId);

  return (
    <div className="space-y-6">
      {/* Search & Filters Header */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule (ex: MBR-0001), téléphone ou quartier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* New Member CTA */}
          {canEditMembers && (
            <button
              onClick={() => onOpenMemberModal()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors whitespace-nowrap"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nouveau Membre</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> État ({formatMoisFrancais(selectedMonth)}) :
            </span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous ({membresWithStats.length})
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              À jour ({membresWithStats.filter((m) => m.statutMoisCourant).length})
            </button>
            <button
              onClick={() => setFilterStatus('late')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterStatus === 'late'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              En retard ({membresWithStats.filter((m) => !m.statutMoisCourant).length})
            </button>
          </div>

          {/* Quartier Selector */}
          {quartiers.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quartier :</span>
              <select
                value={selectedQuartier}
                onChange={(e) => setSelectedQuartier(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Tous les quartiers</option>
                {quartiers.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Container: Member List + Optional Member Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Col / 2 Cols: Member List */}
        <div className={`${selectedMember ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-3`}>
          {filteredMembres.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500">
              <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-base">Aucun membre trouvé</p>
              <p className="text-xs text-slate-400 mt-1">Essayez de modifier votre recherche ou vos filtres.</p>
            </div>
          ) : (
            filteredMembres.map((m) => {
              const isSelected = selectedMemberId === m.id;
              return (
                <div
                  key={m.id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm hover:shadow-md ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20'
                      : 'border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Member Info */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                        {m.nom.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => onSelectMember(isSelected ? null : m.id)}
                            className="font-bold text-slate-900 text-base hover:text-emerald-700 transition-colors text-left"
                          >
                            {m.nom}
                          </button>
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {m.matricule}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {m.telephone}
                          </span>
                          {m.quartier && (
                            <span className="flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" />
                              {m.quartier}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      {/* Current Month Status Badge */}
                      <div>
                        {m.statutMoisCourant ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Payé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Clock className="w-3.5 h-3.5" /> En retard
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!m.statutMoisCourant && (
                          <button
                            onClick={() => handleSendReminder(m)}
                            className="p-2 rounded-lg text-emerald-700 hover:bg-emerald-50 border border-emerald-200 transition-colors"
                            title="Envoyer rappel WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}

                        {canCollectPayments && !m.statutMoisCourant && (
                          <button
                            onClick={() => onOpenPaymentModal(m.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Encaisser</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSelectMember(isSelected ? null : m.id)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="Voir la fiche détaillée et historique"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-emerald-600' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 12-Month Payment Mini Tracker */}
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                      <span className="font-semibold text-slate-600">Historique des 12 mois ({selectedMonth.split('-')[0]}) :</span>
                      <span>Total versé : <strong className="text-emerald-700">{formatMontant(m.montantPayeAnnee, devise)}</strong></span>
                    </div>

                    <div className="grid grid-cols-12 gap-1 sm:gap-1.5 text-center text-[10px]">
                      {m.statutsMois.map((st, idx) => {
                        const moisShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'][idx];
                        const isCurrent = st.mois === selectedMonth;

                        let colorClass = 'bg-slate-100 text-slate-400 border-slate-200';
                        if (st.paye) {
                          colorClass = 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
                        } else if (st.mois <= selectedMonth) {
                          colorClass = 'bg-rose-100 text-rose-700 border-rose-200 font-semibold';
                        }

                        return (
                          <div
                            key={st.mois}
                            title={`${formatMoisFrancais(st.mois)} : ${st.paye ? 'Payé' : 'Non payé'}`}
                            className={`py-1 rounded border transition-all ${colorClass} ${
                              isCurrent ? 'ring-2 ring-slate-800 font-bold scale-105' : ''
                            }`}
                          >
                            {moisShort}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Member Detail Card Drawer */}
        {selectedMember && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-5 sticky top-20 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                  {selectedMember.matricule}
                </span>
                <h3 className="font-bold text-lg text-slate-900 mt-1">
                  {selectedMember.nom}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {selectedMember.telephone}
                </p>
                {selectedMember.quartier && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> {selectedMember.quartier}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1">
                {canEditMembers && (
                  <button
                    onClick={() => onOpenMemberModal(selectedMember)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100"
                    title="Modifier la fiche"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(selectedMember.id, selectedMember.nom)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-700 hover:bg-red-50"
                    title="Supprimer ce membre"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => onSelectMember(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Member Recap Stats */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500">Mois Réglés</span>
                <p className="text-base font-bold text-slate-800 mt-0.5">
                  {selectedMember.moisPayesCount}
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-emerald-700 font-medium">Total Cotisé</span>
                <p className="text-base font-bold text-emerald-800 mt-0.5">
                  {formatMontant(selectedMember.montantPayeAnnee, devise)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {canCollectPayments && (
                <button
                  onClick={() => onOpenPaymentModal(selectedMember.id)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Enregistrer une Cotisation</span>
                </button>
              )}

              <button
                onClick={() => handleSendReminder(selectedMember)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Envoyer Point / Rappel WhatsApp</span>
              </button>
            </div>

            {/* Detailed Payment History */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Historique des versements ({selectedMember.paiements.length})
              </h4>

              {selectedMember.paiements.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Aucun versement enregistré pour le moment.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {selectedMember.paiements.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between text-xs hover:bg-white transition-colors"
                    >
                      <div>
                        <span className="font-bold text-slate-800">
                          {formatMoisFrancais(p.mois)}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {new Date(p.date_paiement).toLocaleDateString('fr-FR')} • {p.mode_paiement || 'Espèces'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-700">
                          {formatMontant(p.montant, devise)}
                        </span>
                        <button
                          onClick={() => onViewReceipt(p)}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          title="Voir / Partager le reçu"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
