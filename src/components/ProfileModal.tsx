'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Camera, Check, Shield } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile, role } = useAuth();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [photo, setPhoto] = useState<string | undefined>('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && currentUser) {
      setNom(currentUser.nom || '');
      setEmail(currentUser.email || '');
      setPhoto(currentUser.photo || '');
      setPassword('');
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser]);

  if (!isOpen || !currentUser) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('La photo ne doit pas d\u00e9passer 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!nom.trim() || !email.trim()) {
      setError('Le nom et l\'email sont obligatoires.');
      return;
    }

    setIsSubmitting(true);
    const res = await updateProfile({
      nom: nom.trim(),
      email: email.trim(),
      photo,
      mot_de_passe: password.trim() || undefined,
    });
    setIsSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Erreur lors de la mise \u00e0 jour.');
      return;
    }

    setSuccessMsg('Profil mis \u00e0 jour avec succ\u00e8s !');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const initials = (nom || 'U').slice(0, 2).toUpperCase();
  const roleLabel = role === 'admin' ? 'Administrateur' : role === 'tresorier' ? 'Tr\u00e9sorier' : 'Membre du Bureau';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-slideUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-50/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <User className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900">Mon Profil</h3>
              <p className="text-xs text-emerald-800 font-medium">Modifier vos informations personnelles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors"
          >
            \u2715
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Avatar Selector */}
          <div className="flex flex-col items-center justify-center pb-2">
            <div className="relative group">
              {photo ? (
                <img
                  src={photo}
                  alt={nom}
                  className="w-20 h-20 rounded-3xl object-cover border-2 border-emerald-500 shadow-md"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black text-xl flex items-center justify-center border-2 border-emerald-500 shadow-md">
                  {initials}
                </div>
              )}
              <label
                htmlFor="user-photo-input"
                className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer transition-all active:scale-90"
                title="Changer la photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="user-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">Appuyez sur l&apos;appareil photo pour changer</p>
          </div>

          {/* Role Badge */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-emerald-600" /> R\u00f4le
            </span>
            <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-xs">
              {roleLabel}
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-2xl font-semibold leading-relaxed">
              {error}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl font-semibold leading-relaxed flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> {successMsg}
            </div>
          )}

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Nom complet *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Ex: Moussa Diallo"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Adresse Email *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="Ex: president@ajahb.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black text-slate-700 block mb-1 uppercase tracking-wider">
              Changer le mot de passe (optionnel)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="Nouveau mot de passe (laisser vide sinon)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white border border-transparent font-semibold"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <Check className="w-5 h-5" />
              <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer le profil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
