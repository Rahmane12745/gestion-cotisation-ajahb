'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { DollarSign, Check, X, TrendingDown, Calendar, Tag } from 'lucide-react';

interface DepenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORIES_DEPENSES = [
  'Réunion Mensuelle',
  'Événement & Fête du Village',
  'Aide Sociale & Solidarité',
  'Achat de Matériel & Fournitures',
  'Transport & Déplacement',
  'Autre',
];

export const DepenseModal: React.FC<DepenseModalProps> = ({ isOpen, onClose }) => {
  const { addDepense } = useData();
  const { currentUser } = useAuth();

  const [motif, setMotif] = useState('');
  const [montant, setMontant] = useState<number | ''>('');
  const [categorie, setCategorie] = useState(CATEGORIES_DEPENSES[0]);
  const [remarque, setRemarque] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMotif('');
      setMontant('');
      setCategorie(CATEGORIES_DEPENSES[0]);
      setRemarque('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!motif.trim() || !montant || Number(montant) <= 0) {
      setError('Veuillez renseigner le motif et un montant valide.');
      return;
    }

    setIsSubmitting(true);
    const res = await addDepense({
      motif: motif.trim(),
      montant: Number(montant),
      categorie,
      enregistre_par: currentUser?.nom || 'Trésorier',
      remarque: remarque.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erreur lors de l\'enregistrement de la dépense.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <TrendingDown className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Enregistrer une Dépense</h3>
              <p className="text-xs text-rose-800 font-medium">Déduction directe de la caisse du village</p>
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
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Motif de la dépense *
            </label>
            <input
              type="text"
              placeholder="Ex: Achat eau & nattes réunion du 14..."
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white border border-transparent font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Montant Déboursé (FCFA) *
            </label>
            <input
              type="number"
              placeholder="Ex: 3500"
              value={montant}
              onChange={(e) => setMontant(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-base focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white border border-transparent font-black"
              min={1}
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Catégorie / Contexte
            </label>
            <select
              value={categorie}
              onChange={(e) => setCategorie(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white border border-transparent font-semibold cursor-pointer"
            >
              {CATEGORIES_DEPENSES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Remarque / Justificatif (Optionnel)
            </label>
            <textarea
              placeholder="Ex: Facture N°123 ou accord du président lors de l'assemblée..."
              value={remarque}
              onChange={(e) => setRemarque(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white border border-transparent font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer la dépense'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
