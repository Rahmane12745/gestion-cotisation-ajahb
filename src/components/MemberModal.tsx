'use client';

import React, { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import { Membre } from '@/types';
import { UserPlus, UserCheck, AlertCircle, X } from 'lucide-react';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Membre | null;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit,
}) => {
  const { addMembre, updateMembre } = useData();

  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [quartier, setQuartier] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setNom(memberToEdit.nom);
        setTelephone(memberToEdit.telephone);
        setQuartier(memberToEdit.quartier || '');
      } else {
        setNom('');
        setTelephone('');
        setQuartier('');
      }
      setError('');
    }
  }, [isOpen, memberToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom.trim() || !telephone.trim()) {
      setError('Le nom et le numéro de téléphone sont obligatoires.');
      return;
    }

    setIsSubmitting(true);

    if (memberToEdit) {
      const res = await updateMembre(memberToEdit.id, {
        nom: nom.trim(),
        telephone: telephone.trim(),
        quartier: quartier.trim() || undefined,
      });
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Erreur lors de la mise à jour.');
        return;
      }
    } else {
      const res = await addMembre({
        nom: nom.trim(),
        telephone: telephone.trim(),
        quartier: quartier.trim() || undefined,
      });
      setIsSubmitting(false);
      if (!res.success) {
        setError(res.error || 'Erreur lors de l\'ajout du membre.');
        return;
      }
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {memberToEdit ? <UserCheck className="w-5 h-5 text-emerald-100" /> : <UserPlus className="w-5 h-5 text-emerald-100" />}
            <h3 className="font-bold text-lg">
              {memberToEdit ? 'Modifier la Fiche Membre' : 'Ajouter un Nouveau Membre'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {memberToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Matricule
              </label>
              <input
                type="text"
                disabled
                value={memberToEdit.matricule}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 text-slate-600 font-mono text-sm font-bold border border-slate-200 cursor-not-allowed"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Nom complet *
            </label>
            <input
              type="text"
              placeholder="Ex: Mamadou Diallo"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Numéro de Téléphone (WhatsApp) *
            </label>
            <input
              type="tel"
              placeholder="Ex: +221 77 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Sert d'identifiant unique et pour la réception des reçus WhatsApp.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Quartier / Secteur
            </label>
            <input
              type="text"
              placeholder="Ex: Quartier Est, Marché, Mosquée..."
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none transition-all"
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
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Enregistrement...' : memberToEdit ? 'Enregistrer modifications' : 'Créer le membre'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
