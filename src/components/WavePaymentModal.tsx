'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Membre, Paiement } from '@/types';
import { formatMoisFrancais, formatMontant } from '@/lib/whatsappUtils';
import { X, Check, Search, MessageCircle, CreditCard, ChevronRight } from 'lucide-react';

interface WavePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMemberId?: string | null;
  defaultMonth?: string | null;
  onPaymentSuccess: (paiement: Paiement) => void;
}

export const WavePaymentModal: React.FC<WavePaymentModalProps> = ({
  isOpen,
  onClose,
  defaultMemberId,
  defaultMonth,
  onPaymentSuccess,
}) => {
  const { membres, addPaiement, selectedMonth, montantCotisation, devise } = useData();
  const { currentUser } = useAuth();

  const [step, setStep] = useState<'select-member' | 'confirm'>('confirm');
  const [selectedMember, setSelectedMember] = useState<Membre | null>(null);
  const [targetMonth, setTargetMonth] = useState<string>(selectedMonth);
  const [searchMember, setSearchMember] = useState('');
  const [montant, setMontant] = useState<number>(montantCotisation);
  const [modePaiement, setModePaiement] = useState<string>('Espèces');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setMontant(montantCotisation);
      setModePaiement('Espèces');
      setSearchMember('');
      setTargetMonth(defaultMonth || selectedMonth);

      if (defaultMemberId) {
        const found = membres.find((m) => m.id === defaultMemberId);
        if (found) {
          setSelectedMember(found);
          setStep('confirm');
          return;
        }
      }

      if (membres.length > 0) {
        setSelectedMember(membres[0]);
        setStep(defaultMemberId ? 'confirm' : 'select-member');
      } else {
        setSelectedMember(null);
      }
    }
  }, [isOpen, defaultMemberId, defaultMonth, selectedMonth, montantCotisation, membres]);

  if (!isOpen) return null;

  const currentYear = targetMonth.split('-')[0] || '2026';
  const availableMonths = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
  ].map((m) => `${currentYear}-${m}`);

  const filteredMembres = membres.filter((m) =>
    m.nom.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.telephone.includes(searchMember) ||
    m.matricule.toLowerCase().includes(searchMember.toLowerCase())
  );

  const handleConfirmPayment = async () => {
    if (!selectedMember) {
      setError('Veuillez choisir un membre.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const res = await addPaiement({
      membre_id: selectedMember.id,
      mois: targetMonth,
      montant: Number(montant),
      encaisseur: currentUser?.nom || 'Trésorier',
      mode_paiement: modePaiement,
    });

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erreur lors de l\'encaissement.');
      return;
    }

    if (res.paiement) {
      onPaymentSuccess(res.paiement);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header simple style Wave */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Encaisser une cotisation</h3>
              <p className="text-xs text-slate-500">{formatMoisFrancais(targetMonth)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {step === 'select-member' ? (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                1. Choisir le membre
              </label>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou numéro..."
                  value={searchMember}
                  onChange={(e) => setSearchMember(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-slate-100 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pt-1">
                {filteredMembres.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedMember(m);
                      setStep('confirm');
                    }}
                    className="w-full p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 border border-transparent flex items-center justify-between text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {m.photo ? (
                        <img
                          src={m.photo}
                          alt={m.nom}
                          className="w-10 h-10 rounded-2xl object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                          {m.nom.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-sm text-slate-800">{m.nom}</div>
                        <div className="text-xs text-slate-500">{m.telephone}</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Member Card */}
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedMember?.photo ? (
                    <img
                      src={selectedMember.photo}
                      alt={selectedMember.nom}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {selectedMember?.nom.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-emerald-800 font-semibold">Membre concerné :</p>
                    <p className="font-extrabold text-slate-900 text-base">{selectedMember?.nom}</p>
                    <p className="text-xs text-slate-600">{selectedMember?.telephone}</p>
                  </div>
                </div>

                <button
                  onClick={() => setStep('select-member')}
                  className="text-xs text-emerald-700 font-bold underline px-2 py-1"
                >
                  Changer
                </button>
              </div>

              {/* Month Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  Mois cotisé :
                </label>
                <select
                  value={targetMonth}
                  onChange={(e) => setTargetMonth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  {availableMonths.map((mStr) => (
                    <option key={mStr} value={mStr}>
                      {formatMoisFrancais(mStr)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Big Wave-like Amount Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-center">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant à verser</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <input
                    type="number"
                    value={montant}
                    onChange={(e) => setMontant(Number(e.target.value))}
                    className="text-3xl font-extrabold text-slate-900 w-36 text-center bg-transparent border-b-2 border-emerald-500 focus:outline-none focus:bg-white rounded px-2"
                  />
                  <span className="text-xl font-bold text-emerald-700">{devise}</span>
                </div>

                {/* Quick amount presets */}
                <div className="flex items-center justify-center gap-2 mt-3">
                  {[1000, 2000, 5000, 10000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMontant(val)}
                      className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                        montant === val
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {val.toLocaleString('fr-FR')} F
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode Selector Simple */}
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1.5 block">
                  Mode de versement
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {['Espèces', 'Wave', 'Orange Money'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setModePaiement(m)}
                      className={`py-2 px-1 rounded-xl font-bold border transition-all text-center ${
                        modePaiement === m
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'Espèces' ? '💵 Espèces' : m === 'Wave' ? '🌊 Wave' : '🍊 OM'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big Wave-style Action Button */}
              <button
                onClick={handleConfirmPayment}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Check className="w-5 h-5" />
                <span>{isSubmitting ? 'Validation...' : `Valider pour ${formatMoisFrancais(targetMonth)}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
