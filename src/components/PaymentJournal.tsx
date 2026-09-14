'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Paiement } from '@/types';
import { formatMoisFrancais, formatMontant, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import {
  Search,
  CreditCard,
  Share2,
  Trash2,
  Calendar,
  Filter,
  CheckCircle2,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface PaymentJournalProps {
  onViewReceipt: (paiement: Paiement) => void;
  onOpenPaymentModal: () => void;
  onOpenExportModal: () => void;
}

export const PaymentJournal: React.FC<PaymentJournalProps> = ({
  onViewReceipt,
  onOpenPaymentModal,
  onOpenExportModal,
}) => {
  const { paiements, membres, devise, nomVillage, deletePaiement } = useData();
  const { canCollectPayments, isAdmin } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  const membresMap = useMemo(() => new Map(membres.map((m) => [m.id, m])), [membres]);

  // Liste unique des mois présents dans les paiements
  const recordedMonths = useMemo(() => {
    const set = new Set<string>();
    paiements.forEach((p) => set.add(p.mois));
    return Array.from(set).sort().reverse();
  }, [paiements]);

  // Filtrage
  const filteredPaiements = useMemo(() => {
    return paiements.filter((p) => {
      const membre = membresMap.get(p.membre_id);
      const searchTarget = `${membre?.nom || ''} ${membre?.matricule || ''} ${p.reference_recu || ''} ${p.encaisseur || ''}`.toLowerCase();
      const matchSearch = searchTarget.includes(searchQuery.toLowerCase());

      const matchMode = filterMode === 'all' || p.mode_paiement === filterMode;
      const matchMonth = filterMonth === 'all' || p.mois === filterMonth;

      return matchSearch && matchMode && matchMonth;
    });
  }, [paiements, membresMap, searchQuery, filterMode, filterMonth]);

  const totalFiltered = filteredPaiements.reduce((sum, p) => sum + Number(p.montant), 0);

  const handleDeletePaiement = async (id: string, ref: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir annuler le versement ${ref} ? Cette action est irréversible.`)) {
      await deletePaiement(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par n° reçu, nom du membre, encaisseur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Exporter Excel</span>
            </button>

            {canCollectPayments && (
              <button
                onClick={onOpenPaymentModal}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition-colors whitespace-nowrap"
              >
                <CreditCard className="w-4 h-4" />
                <span>Nouveau Versement</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-600">Mois :</span>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Tous les mois</option>
                {recordedMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMoisFrancais(m)}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-600">Mode :</span>
              <select
                value={filterMode}
                onChange={(e) => setFilterMode(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">Tous les modes</option>
                <option value="Espèces">Espèces</option>
                <option value="Wave">Wave</option>
                <option value="Orange Money">Orange Money</option>
                <option value="Virement">Virement</option>
                <option value="Chèque">Chèque</option>
              </select>
            </div>
          </div>

          <div className="font-semibold text-slate-700">
            Total affiché : <span className="text-emerald-700 font-bold">{formatMontant(totalFiltered, devise)}</span> ({filteredPaiements.length} versements)
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filteredPaiements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-700 text-base">Aucun versement trouvé</p>
            <p className="text-xs text-slate-400 mt-1">Modifiez vos critères de recherche ou enregistrez un paiement.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">N° Reçu</th>
                  <th className="py-3.5 px-4">Membre</th>
                  <th className="py-3.5 px-4">Mois Cotisé</th>
                  <th className="py-3.5 px-4">Montant</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4">Date & Encaissé par</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPaiements.map((p) => {
                  const membre = membresMap.get(p.membre_id);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {p.reference_recu || p.id.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{membre?.nom || 'Inconnu'}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{membre?.matricule} • {membre?.telephone}</div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {formatMoisFrancais(p.mois)}
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-emerald-700">
                        {formatMontant(p.montant, devise)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {p.mode_paiement || 'Espèces'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{new Date(p.date_paiement).toLocaleDateString('fr-FR')} à {new Date(p.date_paiement).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[11px] text-slate-400 font-medium">Par {p.encaisseur}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onViewReceipt(p)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs font-semibold"
                            title="Partager le reçu WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span className="hidden md:inline">Reçu WhatsApp</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDeletePaiement(p.id, p.reference_recu || p.id.slice(0, 8))}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Annuler ce versement"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
