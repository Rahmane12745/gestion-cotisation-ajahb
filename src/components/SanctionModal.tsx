'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Membre } from '@/types';
import { AlertTriangle, ShieldAlert, Check, Trash2 } from 'lucide-react';

interface SanctionModalProps {
  isOpen: boolean;
  onClose: () => void;
  membre: Membre | null;
}

export const SanctionModal: React.FC<SanctionModalProps> = ({
  isOpen,
  onClose,
  membre,
}) => {
  const { updateMembre } = useData();

  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && membre) {
      setMotif(membre.sanction || '');
      setMontant(membre.sanction_montant || '');
      setError('');
    }
  }, [isOpen, membre]);

  if (!isOpen || !membre) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!motif.trim()) {
      setError('Veuillez préciser le motif de la sanction.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateMembre(membre.id, {
      sanction: motif.trim(),
      sanction_montant: Number(montant) || 0,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erreur lors de l\'enregistrement de la sanction.');
      return;
    }

    onClose();
  };

  const handleRemoveSanction = async () => {
    if (!window.confirm('Voulez-vous vraiment lever cette sanction ?')) return;

    setIsSubmitting(true);
    const res = await updateMembre(membre.id, {
      sanction: undefined,
      sanction_montant: 0,
    });
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-amber-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Sanction & Pénalité</h3>
              <p className="text-xs text-amber-800 font-medium">{membre.nom} ({membre.matricule})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">
              Motif de la Sanction / Avertissement *
            </label>
            <textarea
              placeholder="Ex: Retard répété aux réunions, non-respect du règlement, absence injustifiée..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white border border-transparent font-medium"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1">
              Montant de la Pénalité / Amende en FCFA (Optionnel)
            </label>
            <input
              type="number"
              placeholder="Ex: 1000"
              value={montant}
              onChange={(e) => setMontant(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white border border-transparent font-semibold"
              min={0}
            />
          </div>

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Appliquer la sanction'}</span>
            </button>

            {membre.sanction && (
              <button
                type="button"
                onClick={handleRemoveSanction}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Lever / Annuler la sanction</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
