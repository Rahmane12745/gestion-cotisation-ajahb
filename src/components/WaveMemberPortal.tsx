'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatMoisFrancais, formatMontant } from '@/lib/whatsappUtils';
import { MembreWithStats, Paiement } from '@/types';
import {
  User,
  Camera,
  Check,
  Clock,
  MessageCircle,
  Phone,
  MapPin,
  Shield,
  LogOut,
  Edit,
  Save,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface WaveMemberPortalProps {
  onViewReceipt: (p: Paiement) => void;
  onLogout?: () => void;
}

export const WaveMemberPortal: React.FC<WaveMemberPortalProps> = ({ onViewReceipt, onLogout }) => {
  const { membresWithStats, paiements, updateMembre, devise, montantCotisation, nomVillage } = useData();
  const { currentUser, logout, updateProfile } = useAuth();

  // Trouver le membre correspondant à l'utilisateur connecté
  const membreAssocie = useMemo(() => {
    if (!currentUser) return null;
    // 1. Chercher par membre_id si défini
    if (currentUser.membre_id) {
      const found = membresWithStats.find((m) => m.id === currentUser.membre_id);
      if (found) return found;
    }
    // 2. Chercher par correspondance d'email / nom
    const byEmail = membresWithStats.find(
      (m) => m.nom.toLowerCase().includes(currentUser.nom.toLowerCase()) ||
             currentUser.nom.toLowerCase().includes(m.nom.toLowerCase())
    );
    if (byEmail) return byEmail;

    // 3. Fallback sur le premier membre
    return membresWithStats[0] || null;
  }, [currentUser, membresWithStats]);

  const [isEditing, setIsEditing] = useState(false);
  const [telephone, setTelephone] = useState(membreAssocie?.telephone || '');
  const [quartier, setQuartier] = useState(membreAssocie?.quartier || '');
  const [photo, setPhoto] = useState(membreAssocie?.photo || currentUser?.photo || '');
  const [password, setPassword] = useState('');
  const [savingMsg, setSavingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Année sélectionnée (par défaut l'année en cours '2026')
  const year = '2026';
  const months = [
    '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12'
  ];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('La photo ne doit pas dépasser 2 Mo.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPhoto(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMsg('');
    setErrorMsg('');

    if (!membreAssocie) return;

    try {
      // 1. Mettre à jour le membre dans DataContext
      await updateMembre(membreAssocie.id, {
        telephone,
        quartier,
        photo,
      });

      // 2. Mettre à jour le compte utilisateur s'il y a un mot de passe ou une photo
      await updateProfile({
        photo,
        mot_de_passe: password.trim() || undefined,
      });

      setSavingMsg('Profil et photo mis à jour avec succès !');
      setIsEditing(false);
      setTimeout(() => setSavingMsg(''), 3000);
    } catch {
      setErrorMsg('Erreur lors de la sauvegarde.');
    }
  };

  if (!membreAssocie) {
    return (
      <div className="max-w-md mx-auto p-6 bg-white rounded-3xl text-center space-y-4 shadow-sm border border-slate-200">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="font-bold text-slate-800 text-lg">Aucun membre associé</h3>
        <p className="text-xs text-slate-500">
          Votre compte utilisateur n&apos;est pas encore lié à une fiche de membre du village. Contactez l&apos;administrateur.
        </p>
        <button
          onClick={onLogout || logout}
          className="px-4 py-2 bg-slate-900 text-white rounded-2xl text-xs font-bold"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  // Calcul des statistiques personnelles du membre
  const currentMonthStr = `${year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const isPaidCurrentMonth = membreAssocie.statutMoisCourant;
  const totalPaidMonths = membreAssocie.moisPayesCount;
  const totalPaidAmount = membreAssocie.montantPayeAnnee;

  // Paiements indexés par mois
  const paiementsByMonth = new Map<string, Paiement>();
  paiements
    .filter((p) => p.membre_id === membreAssocie.id)
    .forEach((p) => paiementsByMonth.set(p.mois, p));

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 sm:pb-8 animate-slideUp">
      {/* 1. Header du Portail Membre */}
      <div className="relative rounded-3xl p-5 sm:p-6 text-white overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border border-emerald-500/20">
        {/* Glow Effects */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          {/* Avatar + Member Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative group flex-shrink-0">
              {membreAssocie.photo || photo ? (
                <img
                  src={photo || membreAssocie.photo}
                  alt={membreAssocie.nom}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-white/40 shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur text-white font-black text-xl flex items-center justify-center border-2 border-white/40 shadow-lg">
                  {membreAssocie.nom.slice(0, 2).toUpperCase()}
                </div>
              )}
              <label
                htmlFor="portal-photo-input"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-white text-emerald-800 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all"
                title="Changer ma photo de profil"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="portal-photo-input"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="min-w-0">
              <span className="text-[10px] font-mono text-emerald-200 font-extrabold bg-white/15 px-2 py-0.5 rounded-full border border-white/20">
                {membreAssocie.matricule}
              </span>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white truncate mt-1">
                {membreAssocie.nom}
              </h2>
              {membreAssocie.surnom && (
                <p className="text-xs text-emerald-200 font-medium truncate">({membreAssocie.surnom})</p>
              )}
              <p className="text-[11px] text-emerald-100/90 font-medium truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-300" />
                {membreAssocie.quartier || 'Village AJAHB'}
              </p>
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout || logout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-colors flex-shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Financial Badges Summary */}
        <div className="mt-4 pt-4 border-t border-emerald-500/30 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-400/30">
            <p className="text-[10px] text-emerald-200 font-extrabold uppercase">Mois Réglés</p>
            <p className="text-lg font-black text-white mt-0.5">
              {totalPaidMonths} <span className="text-xs text-emerald-300 font-bold">/ 12</span>
            </p>
          </div>
          <div className="bg-emerald-950/40 rounded-2xl p-3 border border-emerald-400/30">
            <p className="text-[10px] text-emerald-200 font-extrabold uppercase">Total Versé</p>
            <p className="text-lg font-black text-emerald-300 mt-0.5">
              {formatMontant(totalPaidAmount, devise)}
            </p>
          </div>
        </div>
      </div>

      {savingMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {savingMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 2. Bouton d'édition du profil */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Mes Informations Personnelles</h3>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 text-xs font-extrabold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200/60 transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>{isEditing ? 'Annuler' : 'Modifier'}</span>
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">Téléphone WhatsApp</label>
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">Quartier</label>
              <input
                type="text"
                value={quartier}
                onChange={(e) => setQuartier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ex: Quartier Central"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 uppercase mb-1">Nouveau mot de passe (optionnel)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-900 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Laisser vide sinon"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-medium text-slate-600">
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Téléphone</span>
              <span className="font-bold text-slate-800">{membreAssocie.telephone || 'Non renseigné'}</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Quartier</span>
              <span className="font-bold text-slate-800">{membreAssocie.quartier || 'Non renseigné'}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Suivi des Cotisations — 12 Mois de l'Année */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base font-black text-slate-900">Suivi des Cotisations {year}</h3>
            <p className="text-xs text-slate-500 font-medium">Mises à jour instantanées en temps réel</p>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            {montantCotisation.toLocaleString('fr-FR')} {devise} / mois
          </span>
        </div>

        <div className="space-y-2">
          {months.map((mNum) => {
            const mStr = `${year}-${mNum}`;
            const paiement = paiementsByMonth.get(mStr);
            const isPaid = !!paiement;

            return (
              <div
                key={mStr}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  isPaid
                    ? 'bg-white border-emerald-200/90 shadow-xs'
                    : 'bg-white border-slate-200/80 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isPaid ? <Check className="w-5 h-5 stroke-[3]" /> : <Clock className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-slate-900">
                      {formatMoisFrancais(mStr)}
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {isPaid ? (
                        <span className="text-emerald-700 font-bold">
                          Payé le {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')} ({paiement.mode_paiement || 'Espèces'})
                        </span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          Non versé • {formatMontant(montantCotisation, devise)} dû
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPaid ? (
                    <button
                      onClick={() => onViewReceipt(paiement)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 font-black text-xs transition-colors"
                      title="Voir le reçu"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reçu</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200/60">
                      En attente
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
