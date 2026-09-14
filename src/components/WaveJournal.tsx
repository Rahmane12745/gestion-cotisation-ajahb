'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { Paiement } from '@/types';
import { formatMoisFrancais, formatMontant } from '@/lib/whatsappUtils';
import { Search, MessageCircle, CreditCard } from 'lucide-react';

interface WaveJournalProps {
  onViewReceipt: (p: Paiement) => void;
}

export const WaveJournal: React.FC<WaveJournalProps> = ({ onViewReceipt }) => {
  const { paiements, membres, devise } = useData();
  const [search, setSearch] = useState('');

  const membresMap = useMemo(() => new Map(membres.map((m) => [m.id, m])), [membres]);

  const filteredPaiements = paiements.filter((p) => {
    const membre = membresMap.get(p.membre_id);
    const text = `${membre?.nom || ''} ${p.mois} ${p.reference_recu || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <div className="max-w-md mx-auto space-y-4 pb-20 sm:pb-8">
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-extrabold text-slate-900">Journal des Versements</h2>
        <p className="text-xs text-slate-500">Tous les reçus délivrés ({paiements.length})</p>

        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher un versement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        {filteredPaiements.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center text-slate-400 text-xs border border-slate-200">
            Aucun versement trouvé.
          </div>
        ) : (
          filteredPaiements.map((p) => {
            const membre = membresMap.get(p.membre_id);
            return (
              <div
                key={p.id}
                onClick={() => onViewReceipt(p)}
                className="bg-white rounded-2xl p-4 border border-slate-200/70 shadow-sm hover:border-emerald-300 transition-all flex items-center justify-between gap-3 cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs flex items-center justify-center">
                    💰
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900 truncate">
                      {membre?.nom || 'Membre'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatMoisFrancais(p.mois)} • {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="text-right flex items-center gap-2">
                  <div>
                    <span className="font-extrabold text-emerald-700 text-sm block">
                      +{formatMontant(p.montant, devise)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {p.reference_recu || p.id.slice(0, 8).toUpperCase()}
                    </span>
                  </div>
                  <div className="p-2 rounded-full bg-emerald-50 text-emerald-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
