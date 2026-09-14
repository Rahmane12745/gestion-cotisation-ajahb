'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { Membre, ModePaiement, Paiement } from '@/types';
import { formatMoisFrancais, formatMontant, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import { CreditCard, CheckCircle2, MessageCircle, AlertCircle, X, ArrowRight } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMemberId?: string | null;
  onPaymentSuccess: (paiement: Paiement) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  defaultMemberId,
  onPaymentSuccess,
}) => {
  const { membres, addPaiement, selectedMonth, montantCotisation, devise, nomVillage } = useData();
  const { currentUser } = useAuth();

  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [mois, setMois] = useState<string>(selectedMonth);
  const [montant, setMontant] = useState<number>(montantCotisation);
  const [modePaiement, setModePaiement] = useState<ModePaiement>('Espèces');
  const [encaisseur, setEncaisseur] = useState<string>('');
  const [remarque, setRemarque] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(defaultMemberId || (membres.length > 0 ? membres[0].id : ''));
      setMois(selectedMonth);
      setMontant(montantCotisation);
      setEncaisseur(currentUser?.nom || 'Trésorier');
      setModePaiement('Espèces');
      setRemarque('');
      setError('');
    }
  }, [isOpen, defaultMemberId, selectedMonth, montantCotisation, currentUser, membres]);

  if (!isOpen) return null;

  const currentYear = mois.split('-')[0] || '2026';
  const availableMonths = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'
  ].map((m) => `${currentYear}-${m}`);

  const selectedMembre = membres.find((m) => m.id === selectedMemberId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedMemberId) {
      setError('Veuillez sélectionner un membre.');
      return;
    }

    if (!montant || montant <= 0) {
      setError('Le montant doit être supérieur à zéro.');
      return;
    }

    setIsSubmitting(true);

    const result = await addPaiement({
      membre_id: selectedMemberId,
      mois,
      montant: Number(montant),
      encaisseur: encaisseur.trim() || 'Trésorier',
      mode_paiement: modePaiement,
      remarque: remarque.trim() || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || 'Erreur lors de l\'enregistrement.');
      return;
    }

    if (result.paiement) {
      onPaymentSuccess(result.paiement);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
              <CreditCard className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Enregistrer un Versement</h3>
              <p className="text-xs text-emerald-100">Génération automatique du reçu numérique</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Member Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Membre concerné *
            </label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              required
            >
              <option value="" disabled>-- Sélectionner un membre --</option>
              {membres.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.matricule} - {m.nom} ({m.telephone})
                </option>
              ))}
            </select>
            {selectedMembre && (
              <p className="text-xs text-slate-500 mt-1">
                📍 {selectedMembre.quartier || 'Quartier non renseigné'} | 📞 {selectedMembre.telephone}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Month */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mois cotisé *
              </label>
              <select
                value={mois}
                onChange={(e) => setMois(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                required
              >
                {availableMonths.map((mStr) => (
                  <option key={mStr} value={mStr}>
                    {formatMoisFrancais(mStr)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Montant ({devise}) *
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={montant}
                onChange={(e) => setMontant(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Mode de versement
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              >
                <option value="Espèces">💵 Espèces (Mains propres)</option>
                <option value="Wave">🌊 Wave</option>
                <option value="Orange Money">🍊 Orange Money</option>
                <option value="Virement">🏦 Virement Bancaire</option>
                <option value="Chèque">🧾 Chèque</option>
              </select>
            </div>

            {/* Cashier / Registered By */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Encaissé par *
              </label>
              <input
                type="text"
                value={encaisseur}
                onChange={(e) => setEncaisseur(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
                placeholder="Nom du trésorier"
                required
              />
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Remarque / Référence (Optionnel)
            </label>
            <input
              type="text"
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              placeholder="Ex: Reçu en réunion du quartier, Tx Wave #123456"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Valider & Générer Reçu'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
