'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useData } from '@/context/DataContext';
import { Membre } from '@/types';
import { UserPlus, UserCheck, Check, Camera, Trash2 } from 'lucide-react';

interface WaveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberToEdit?: Membre | null;
}

export const WaveMemberModal: React.FC<WaveMemberModalProps> = ({
  isOpen,
  onClose,
  memberToEdit = null,
}) => {
  const { addMembre, updateMembre } = useData();

  const [nom, setNom] = useState('');
  const [surnom, setSurnom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [quartier, setQuartier] = useState('');
  const [photo, setPhoto] = useState<string>('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (memberToEdit) {
        setNom(memberToEdit.nom || '');
        setSurnom(memberToEdit.surnom || '');
        setTelephone(memberToEdit.telephone || '');
        setQuartier(memberToEdit.quartier || '');
        setPhoto(memberToEdit.photo || '');
      } else {
        setNom('');
        setSurnom('');
        setTelephone('');
        setQuartier('');
        setPhoto('');
      }
      setError('');
    }
  }, [isOpen, memberToEdit]);

  if (!isOpen) return null;

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!nom.trim() || !telephone.trim()) {
      setError('Veuillez renseigner le nom et le numéro de téléphone.');
      return;
    }

    setIsSubmitting(true);

    let res: { success: boolean; error?: string };

    if (memberToEdit) {
      res = await updateMembre(memberToEdit.id, {
        nom: nom.trim(),
        surnom: surnom.trim() || undefined,
        telephone: telephone.trim(),
        quartier: quartier.trim() || undefined,
        photo: photo || undefined,
      });
    } else {
      res = await addMembre({
        nom: nom.trim(),
        surnom: surnom.trim() || undefined,
        telephone: telephone.trim(),
        quartier: quartier.trim() || undefined,
        photo: photo || undefined,
      });
    }

    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erreur lors de l\'enregistrement.');
      return;
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {memberToEdit ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">
                {memberToEdit ? 'Modifier le Membre' : 'Nouveau Membre'}
              </h3>
              <p className="text-xs text-slate-500">
                {memberToEdit ? `Matricule ${memberToEdit.matricule}` : 'Ajout membre avec photo'}
              </p>
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
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold">
              {error}
            </div>
          )}

          {/* Photo Upload Section */}
          <div className="flex flex-col items-center justify-center pb-1">
            <div className="relative group">
              {photo ? (
                <div className="relative">
                  <img
                    src={photo}
                    alt="Aperçu"
                    className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto('')}
                    className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-rose-600 text-white shadow-sm hover:bg-rose-700"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-3xl bg-slate-100 hover:bg-emerald-50 text-slate-500 hover:text-emerald-700 border-2 border-dashed border-slate-300 hover:border-emerald-400 flex flex-col items-center justify-center gap-1 transition-all shadow-inner"
                >
                  <Camera className="w-6 h-6 text-slate-400 group-hover:text-emerald-600" />
                  <span className="text-[10px] font-bold">Photo</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1.5">
              {photo ? 'Photo sélectionnée' : 'Ajouter une photo de profil (Appareil ou Galerie)'}
            </p>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Nom & Prénom *
            </label>
            <input
              type="text"
              placeholder="Ex: Cheikh Ndiaye"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-semibold"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Surnom (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Baye, Modou, Titi..."
              value={surnom}
              onChange={(e) => setSurnom(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-medium"
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Numéro Téléphone (WhatsApp) *
            </label>
            <input
              type="tel"
              placeholder="Ex: +221 77 123 45 67"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-semibold"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Quartier (Optionnel)
            </label>
            <input
              type="text"
              placeholder="Ex: Grand Baobab, Marché, Mosquée..."
              value={quartier}
              onChange={(e) => setQuartier(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-medium"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>
                {isSubmitting
                  ? 'Enregistrement...'
                  : memberToEdit
                  ? 'Mettre à jour le membre'
                  : 'Enregistrer le membre'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
