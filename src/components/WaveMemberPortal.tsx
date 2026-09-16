'use client';

import React, { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatMoisFrancais, formatMontant } from '@/lib/whatsappUtils';
import { Paiement } from '@/types';
import {
  User,
  Camera,
  Check,
  Clock,
  MessageCircle,
  Phone,
  MapPin,
  LogOut,
  Save,
  AlertCircle,
  CheckCircle2,
  Receipt,
  Lock,
  Wallet,
  Calendar,
  Bell,
  ShieldAlert,
} from 'lucide-react';

interface WaveMemberPortalProps {
  onViewReceipt: (p: Paiement) => void;
  onLogout?: () => void;
  portalTab?: 'cotisations' | 'notifications' | 'profil';
  setPortalTab?: (tab: 'cotisations' | 'notifications' | 'profil') => void;
}

export const WaveMemberPortal: React.FC<WaveMemberPortalProps> = ({
  onViewReceipt,
  onLogout,
  portalTab: externalPortalTab,
  setPortalTab: externalSetPortalTab,
}) => {
  const { membresWithStats, paiements, updateMembre, devise, montantCotisation, nomVillage } = useData();
  const { currentUser, logout, updateProfile } = useAuth();

  // Navigation tab pour l'espace membre: 'cotisations' | 'notifications' | 'profil'
  const [internalPortalTab, setInternalPortalTab] = useState<'cotisations' | 'notifications' | 'profil'>('cotisations');
  const portalTab = externalPortalTab !== undefined ? externalPortalTab : internalPortalTab;
  const setPortalTab = (tab: 'cotisations' | 'notifications' | 'profil') => {
    if (externalSetPortalTab) {
      externalSetPortalTab(tab);
    }
    setInternalPortalTab(tab);
  };

  // Trouver le membre correspondant à l'utilisateur connecté
  const membreAssocie = useMemo(() => {
    if (!currentUser) return null;
    if (currentUser.membre_id) {
      const found = membresWithStats.find((m) => m.id === currentUser.membre_id);
      if (found) return found;
    }
    const byEmail = membresWithStats.find(
      (m) => m.nom.toLowerCase().includes(currentUser.nom.toLowerCase()) ||
             currentUser.nom.toLowerCase().includes(m.nom.toLowerCase())
    );
    if (byEmail) return byEmail;
    return membresWithStats[0] || null;
  }, [currentUser, membresWithStats]);

  const [nom, setNom] = useState(membreAssocie?.nom || currentUser?.nom || '');
  const [telephone, setTelephone] = useState(membreAssocie?.telephone || '');
  const [quartier, setQuartier] = useState(membreAssocie?.quartier || '');
  const [photo, setPhoto] = useState(membreAssocie?.photo || currentUser?.photo || '');
  const [password, setPassword] = useState('');
  const [savingMsg, setSavingMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    setIsSubmitting(true);
    try {
      await updateMembre(membreAssocie.id, {
        nom: nom.trim() || membreAssocie.nom,
        telephone: telephone.trim(),
        quartier: quartier.trim(),
        photo: photo || undefined,
      });

      await updateProfile({
        nom: nom.trim() || undefined,
        photo: photo || undefined,
        mot_de_passe: password.trim() || undefined,
      });

      setSavingMsg('Votre profil et photo ont été mis à jour avec succès !');
      setPassword('');
      setTimeout(() => setSavingMsg(''), 4000);
    } catch {
      setErrorMsg('Erreur lors de la sauvegarde du profil.');
    } finally {
      setIsSubmitting(false);
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

  const totalPaidMonths = membreAssocie.moisPayesCount;
  const totalPaidAmount = membreAssocie.montantPayeAnnee;
  const remainingMonths = 12 - totalPaidMonths;
  const remainingAmount = remainingMonths * montantCotisation;

  const paiementsByMonth = new Map<string, Paiement>();
  paiements
    .filter((p) => p.membre_id === membreAssocie.id)
    .forEach((p) => paiementsByMonth.set(p.mois, p));

  const memberPaiementsSorted = useMemo(() => {
    return paiements
      .filter((p) => p.membre_id === membreAssocie.id)
      .sort((a, b) => new Date(b.date_paiement).getTime() - new Date(a.date_paiement).getTime());
  }, [paiements, membreAssocie.id]);

  return (
    <div className="max-w-md mx-auto space-y-4 pb-24 sm:pb-8 animate-slideUp">
      {/* 1. Hero Card Profil Membre */}
      <div className="relative rounded-3xl p-5 text-white overflow-hidden shadow-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 border border-emerald-500/20">
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative group flex-shrink-0">
              {photo || membreAssocie.photo ? (
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
                htmlFor="portal-photo-input-header"
                className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-white text-emerald-800 shadow-md cursor-pointer hover:scale-110 active:scale-95 transition-all"
                title="Changer ma photo de profil"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="portal-photo-input-header"
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
              <p className="text-[11px] text-emerald-100/90 font-medium truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-300" />
                {quartier || membreAssocie.quartier || 'Village AJAHB'}
              </p>
            </div>
          </div>

          <button
            onClick={onLogout || logout}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 hover:text-white transition-colors flex-shrink-0"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Stats bar */}
        <div className="mt-4 pt-3.5 border-t border-emerald-500/30 grid grid-cols-2 gap-3 text-xs">
          <div className="bg-emerald-950/40 rounded-2xl p-2.5 border border-emerald-400/30">
            <p className="text-[10px] text-emerald-200 font-extrabold uppercase">Mois Versés</p>
            <p className="text-base font-black text-white mt-0.5">
              {totalPaidMonths} <span className="text-xs text-emerald-300 font-bold">/ 12 mois</span>
            </p>
          </div>
          <div className="bg-emerald-950/40 rounded-2xl p-2.5 border border-emerald-400/30">
            <p className="text-[10px] text-emerald-200 font-extrabold uppercase">Total Réglé</p>
            <p className="text-base font-black text-emerald-300 mt-0.5">
              {formatMontant(totalPaidAmount, devise)}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Barre de Navigation Onglets : Cotisations | Notifications | Profil */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-200/60 rounded-2xl font-black text-xs">
        <button
          onClick={() => setPortalTab('cotisations')}
          className={`flex-1 py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            portalTab === 'cotisations'
              ? 'bg-white text-emerald-800 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Cotisations</span>
        </button>

        <button
          onClick={() => setPortalTab('notifications')}
          className={`flex-1 py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${
            portalTab === 'notifications'
              ? 'bg-white text-emerald-800 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Notifs ({memberPaiementsSorted.length})</span>
        </button>

        <button
          onClick={() => setPortalTab('profil')}
          className={`flex-1 py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            portalTab === 'profil'
              ? 'bg-white text-emerald-800 shadow-sm font-black'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
          <span className="truncate">Profil</span>
        </button>
      </div>

      {savingMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          {savingMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* 3. Onglet 2 : Notifications & Reçus de validation avec Photo du Village */}
      {portalTab === 'notifications' && (
        <div className="space-y-4">
          {/* Bannière Photo du Village */}
          <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 min-h-[140px] flex items-end p-4 text-white">
            <img
              src="/village.jpg"
              alt="Photo du Village AJAHB"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />

            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-slate-900/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {nomVillage} • Portail Officiel
              </span>
              <h3 className="text-lg font-black text-white leading-tight">
                Notifications & Validations
              </h3>
              <p className="text-xs text-slate-200 font-medium">
                Appuyez sur une notification pour afficher la totalité des informations et votre reçu.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Historique des validations ({memberPaiementsSorted.length})
            </h4>
            <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Cliquez pour le reçu
            </span>
          </div>

          {/* Note ou Sanction administrative s'il y en a une */}
          {membreAssocie.sanction && (
            <div className="p-4 bg-amber-50 border border-amber-200/90 rounded-2xl shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Sanction ou Note administrative active</span>
              </div>
              <p className="text-xs text-amber-900 font-semibold">{membreAssocie.sanction}</p>
              {(membreAssocie.sanction_montant || 0) > 0 && (
                <p className="text-xs font-black text-amber-900">
                  Montant dû : {formatMontant(membreAssocie.sanction_montant || 0, devise)}
                </p>
              )}
            </div>
          )}

          {memberPaiementsSorted.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="font-extrabold text-slate-800 text-sm">Aucune notification pour le moment</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Lorsque l&apos;administrateur ou le trésorier valide une de vos cotisations, une notification instantanée avec votre reçu apparaîtra ici.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memberPaiementsSorted.map((p) => {
                const dateFormatee = new Date(p.date_paiement).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const moisTxt = formatMoisFrancais(p.mois);

                return (
                  <div
                    key={p.id}
                    onClick={() => onViewReceipt(p)}
                    className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs space-y-3 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group active:scale-[0.99]"
                    title="Appuyez pour afficher tous les détails et le reçu"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                            Paiement mois : {moisTxt}
                          </h4>
                          <span className="text-[11px] text-slate-400 font-semibold block mt-0.5">
                            Validé le {dateFormatee}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200 flex-shrink-0">
                        {formatMontant(p.montant, devise)}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-100 text-xs text-slate-700 font-medium space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Validé par :</span>
                        <span className="font-bold text-slate-900">{p.encaisseur}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-semibold">Mode de règlement :</span>
                        <span className="font-bold text-emerald-700">{p.mode_paiement || 'Espèces'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                      <span className="text-[11px] text-slate-400 font-mono">
                        Réf: {p.reference_recu || p.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="text-emerald-700 font-black flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Voir détails & reçu</span> →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Onglet 1 : Suivi des Cotisations (12 Mois) */}
      {portalTab === 'cotisations' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="text-base font-black text-slate-900">Historique des Cotisations {year}</h3>
              <p className="text-xs text-slate-500 font-medium">Mises à jour automatiques en temps réels</p>
            </div>
            <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              {montantCotisation.toLocaleString('fr-FR')} {devise} / mois
            </span>
          </div>

          <div className="space-y-2.5">
            {months.map((mNum) => {
              const mStr = `${year}-${mNum}`;
              const paiement = paiementsByMonth.get(mStr);
              const isPaid = !!paiement;

              return (
                <div
                  key={mStr}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
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
                          : 'bg-slate-100 text-slate-400'
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
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60 font-black text-xs transition-colors"
                        title="Voir le reçu de paiement"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
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
      )}

      {/* 4. Onglet 2 : Modification du Profil & Photo */}
      {portalTab === 'profil' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Modifier Mes Informations</h3>
            <p className="text-xs text-slate-500 font-medium">Changer ma photo, mon téléphone et mon mot de passe</p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Grand sélecteur photo de profil */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative group">
                {photo || membreAssocie.photo ? (
                  <img
                    src={photo || membreAssocie.photo}
                    alt={nom}
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-emerald-500 shadow-md"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white font-black text-2xl flex items-center justify-center border-4 border-emerald-500 shadow-md">
                    {(nom || 'M').slice(0, 2).toUpperCase()}
                  </div>
                )}
                <label
                  htmlFor="portal-tab-photo-input"
                  className="absolute -bottom-1 -right-1 p-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer transition-all active:scale-95"
                  title="Téléverser une photo"
                >
                  <Camera className="w-4.5 h-4.5" />
                  <input
                    id="portal-tab-photo-input"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-slate-400 font-semibold mt-2">Appuyez sur l&apos;appareil photo pour changer</p>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Nom complet</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Numéro Téléphone (WhatsApp)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Quartier</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quartier}
                  onChange={(e) => setQuartier(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Ex: Quartier Central"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">Nouveau mot de passe (optionnel)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-100 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Nouveau mot de passe (laisser vide sinon)"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Save className="w-4.5 h-4.5" />
                <span>{isSubmitting ? 'Enregistrement...' : 'Enregistrer mon profil'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
