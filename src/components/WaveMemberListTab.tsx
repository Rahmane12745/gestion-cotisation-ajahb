'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { MembreWithStats } from '@/types';
import { Search, UserPlus, ChevronRight, Check, AlertCircle, Phone, MapPin } from 'lucide-react';

interface WaveMemberListTabProps {
  onSelectMember: (membre: MembreWithStats) => void;
  onOpenNewMember: () => void;
}

export const WaveMemberListTab: React.FC<WaveMemberListTabProps> = ({
  onSelectMember,
  onOpenNewMember,
}) => {
  const { membresWithStats } = useData();
  const { canEditMembers } = useAuth();
  const [search, setSearch] = useState('');
  const [filterQuarter, setFilterQuarter] = useState<string>('all');

  // Extract unique quarters
  const quarters = useMemo(() => {
    const set = new Set<string>();
    membresWithStats.forEach((m) => {
      if (m.quartier) set.add(m.quartier);
    });
    return Array.from(set);
  }, [membresWithStats]);

  const filteredMembres = useMemo(() => {
    return membresWithStats.filter((m) => {
      const matchSearch =
        m.nom.toLowerCase().includes(search.toLowerCase()) ||
        (m.surnom && m.surnom.toLowerCase().includes(search.toLowerCase())) ||
        m.telephone.includes(search) ||
        m.matricule.toLowerCase().includes(search.toLowerCase()) ||
        (m.quartier && m.quartier.toLowerCase().includes(search.toLowerCase()));

      const matchQuarter = filterQuarter === 'all' || m.quartier === filterQuarter;

      return matchSearch && matchQuarter;
    });
  }, [membresWithStats, search, filterQuarter]);

  const totalPayes = membresWithStats.filter((m) => m.statutMoisCourant).length;
  const totalRetard = membresWithStats.length - totalPayes;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 sm:pb-8 animate-slideUp">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Annuaire des Membres</h2>
            <p className="text-xs text-slate-500 font-medium">
              {membresWithStats.length} membres inscrits au village
            </p>
          </div>

          {canEditMembers && (
            <button
              onClick={onOpenNewMember}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Nouveau</span>
            </button>
          )}
        </div>

        {/* Quick summary status tags */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
            ✅ {totalPayes} à jour
          </span>
          <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200/60">
            ⚠️ {totalRetard} en retard
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          />
        </div>

        {/* Neighborhood Pill Selector */}
        {quarters.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            <button
              onClick={() => setFilterQuarter('all')}
              className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                filterQuarter === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous les quartiers
            </button>
            {quarters.map((q) => (
              <button
                key={q}
                onClick={() => setFilterQuarter(q)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${
                  filterQuarter === q
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Member Cards */}
      <div className="space-y-2.5">
        {filteredMembres.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center text-slate-400 text-xs border border-slate-200">
            Aucun membre ne correspond à votre recherche.
          </div>
        ) : (
          filteredMembres.map((m) => {
            const isCurrentMonthPaid = m.statutMoisCourant;
            const paidCount = m.moisPayesCount;

            return (
              <div
                key={m.id}
                onClick={() => onSelectMember(m)}
                className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all flex items-center justify-between gap-3 cursor-pointer active:scale-[0.99] group"
              >
                {/* Avatar + Name */}
                <div className="flex items-center gap-3 min-w-0">
                  {m.photo ? (
                    <img
                      src={m.photo}
                      alt={m.nom}
                      className="w-11 h-11 rounded-2xl object-cover flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm border border-slate-200/80"
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-transform group-hover:scale-105 shadow-sm ${
                        isCurrentMonthPaid
                          ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m.nom.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-extrabold text-sm text-slate-900 truncate">
                        {m.nom} {m.surnom && <span className="text-emerald-700 font-semibold text-xs">({m.surnom})</span>}
                      </p>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">
                        {m.matricule}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 truncate mt-0.5 font-medium">
                      📞 {m.telephone} {m.quartier ? `• 📍 ${m.quartier}` : ''}
                    </p>
                  </div>
                </div>

                {/* Status & Arrow */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    {isCurrentMonthPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                        <Check className="w-3 h-3 stroke-[3]" /> À jour
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-800 bg-rose-50 border border-rose-200/60 px-2.5 py-0.5 rounded-full">
                        En retard
                      </span>
                    )}
                    <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                      {paidCount} versement{paidCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                    <ChevronRight className="w-4 h-4" />
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
