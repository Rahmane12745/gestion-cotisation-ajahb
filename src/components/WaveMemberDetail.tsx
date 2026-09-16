'use client';

import React, { useState, useRef } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { MembreWithStats, Paiement } from '@/types';
import { formatMoisFrancais, formatMontant, formatTelephoneWhatsApp, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import { exporterFicheMembrePDF } from '@/lib/exportUtils';
import {
  X,
  Phone,
  MapPin,
  Check,
  CreditCard,
  MessageCircle,
  PhoneCall,
  ArrowLeft,
  Camera,
  Trash2,
  Edit2,
  ShieldAlert,
  AlertTriangle,
  Download,
} from 'lucide-react';

interface WaveMemberDetailProps {
  membre: MembreWithStats;
  onClose: () => void;
  onOpenPaymentForMonth: (membreId: string, mois: string) => void;
  onViewReceipt: (paiement: Paiement) => void;
  onEditMember?: (membre: MembreWithStats) => void;
  onOpenSanction?: (membre: MembreWithStats) => void;
}

export const WaveMemberDetail: React.FC<WaveMemberDetailProps> = ({
  membre,
  onClose,
  onOpenPaymentForMonth,
  onViewReceipt,
  onEditMember,
  onOpenSanction,
}) => {
  const { selectedMonth, devise, montantCotisation, nomVillage, updateMembre, deleteMembre } = useData();
  const { canCollectPayments, canEditMembers, isAdmin } = useAuth();

  const [yearFilter, setYearFilter] = useState(selectedMonth.split('-')[0] || '2026');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const cleanPhone = membre.telephone.replace(/\s+/g, '');

  // 12 mois de l'année
  const monthsOfYear = Array.from({ length: 12 }, (_, i) => {
    const monthNum = String(i + 1).padStart(2, '0');
    return `${yearFilter}-${monthNum}`;
  });

  const currentYearMonth = selectedMonth;

  const monthsDetail = monthsOfYear.map((mStr, idx) => {
    const payRecord = membre.paiements.find((p) => p.mois === mStr);
    const monthIndex = idx + 1;
    const isPastOrCurrent = mStr <= currentYearMonth;

    return {
      mois: mStr,
      monthIndex,
      isPaid: Boolean(payRecord),
      payment: payRecord,
      isLate: !payRecord && isPastOrCurrent,
      isFuture: !payRecord && !isPastOrCurrent,
    };
  });

  const totalPaidMonths = monthsDetail.filter((m) => m.isPaid).length;
  const totalLateMonths = monthsDetail.filter((m) => m.isLate).length;
  const totalPaidAmount = monthsDetail.filter((m) => m.isPaid).reduce((sum, m) => sum + (m.payment?.montant || montantCotisation), 0);
  const totalDueAmount = totalLateMonths * montantCotisation;

  // Modification photo
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      if (ev.target?.result) {
        await updateMembre(membre.id, { photo: ev.target.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  // Suppression du membre (Admin)
  const handleDeleteMember = async () => {
    if (window.confirm(`Voulez-vous vraiment SUPPRIMER le membre ${membre.nom} (${membre.matricule}) ? Cette action est irréversible.`)) {
      const res = await deleteMembre(membre.id);
      if (res.success) {
        onClose();
      } else {
        alert(res.error || 'Erreur lors de la suppression.');
      }
    }
  };

  // Envoi d'un récapitulatif complet par WhatsApp
  const handleSendFullRecap = () => {
    const payesList = monthsDetail.filter((m) => m.isPaid).map((m) => `✅ ${formatMoisFrancais(m.mois)}`).join('\n');
    const lateList = monthsDetail.filter((m) => m.isLate).map((m) => `❌ ${formatMoisFrancais(m.mois)}`).join('\n');

    const message =
      `*🏛️ ${nomVillage.toUpperCase()}*\n` +
      `*BILAN DE VOS COTISATIONS (${yearFilter})*\n` +
      `--------------------------------\n` +
      `👤 *Membre :* ${membre.nom}${membre.surnom ? ` (${membre.surnom})` : ''}\n` +
      `🆔 *Matricule :* ${membre.matricule}\n` +
      `📞 *Téléphone :* ${membre.telephone}\n\n` +
      `💰 *Total versé :* ${formatMontant(totalPaidAmount, devise)} (${totalPaidMonths} mois)\n` +
      (totalDueAmount > 0
        ? `⚠️ *Reste en retard :* ${formatMontant(totalDueAmount, devise)} (${totalLateMonths} mois)\n\n`
        : `🎉 *Statut :* Félicitations, vous êtes 100% à jour !\n\n`) +
      `*Détail de vos mois (${yearFilter}) :*\n` +
      (payesList ? `${payesList}\n` : '') +
      (lateList ? `\n*Mois en retard :*\n${lateList}\n` : '') +
      `\nMerci pour votre engagement au village.`;

    partagerSurWhatsApp(membre.telephone, message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      {/* Container Full Height Mobile Shell */}
      <div className="bg-white w-full max-w-md h-full sm:h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slideUp">
        {/* Top Sticky Header */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-2xl bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Profile Avatar / Photo */}
            <div className="relative group">
              {membre.photo ? (
                <img
                  src={membre.photo}
                  alt={membre.nom}
                  className="w-12 h-12 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-base flex items-center justify-center shadow-sm">
                  {membre.nom.slice(0, 2).toUpperCase()}
                </div>
              )}

              {canEditMembers && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-900 text-white hover:bg-emerald-600 transition-colors shadow"
                  title="Changer la photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                  {membre.nom} {membre.surnom && <span className="text-emerald-700 text-sm font-bold">({membre.surnom})</span>}
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {membre.matricule}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {membre.telephone} {membre.quartier ? `• 📍 ${membre.quartier}` : ''}
              </p>
            </div>
          </div>

          {/* Direct call shortcut */}
          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${cleanPhone}`}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors shadow-sm"
              title="Appeler directement"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold sm:hidden"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Admin & Trésorier Action Controls Bar */}
        {(canEditMembers || isAdmin) && (
          <div className="bg-slate-100/90 border-b border-slate-200/80 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Actions d'administration :
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Modifier */}
              {canEditMembers && onEditMember && (
                <button
                  onClick={() => onEditMember(membre)}
                  className="px-3 py-1 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Modifier les informations"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Modifier</span>
                </button>
              )}

              {/* Sanctionner (Admin) */}
              {isAdmin && onOpenSanction && (
                <button
                  onClick={() => onOpenSanction(membre)}
                  className="px-3 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Appliquer une sanction"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>Sanction</span>
                </button>
              )}

              {/* Supprimer (Admin) */}
              {isAdmin && (
                <button
                  onClick={handleDeleteMember}
                  className="px-3 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                  title="Supprimer le membre"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Supprimer</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Active Sanction Alert Box if present */}
          {membre.sanction && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex items-start gap-3 animate-[popIn_0.3s_ease-out]">
              <div className="p-2 rounded-2xl bg-amber-500 text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider">
                  ⚠️ Sanction Active
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 font-semibold">{membre.sanction}</p>
                {Number(membre.sanction_montant) > 0 && (
                  <p className="text-xs text-amber-900 font-extrabold mt-1">
                    Amende à payer : {formatMontant(Number(membre.sanction_montant), devise)}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Member Info Card & Quick Stats */}
          <div className="relative rounded-3xl p-5 text-white overflow-hidden shadow-xl bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#022c22] border border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-200/90 font-extrabold uppercase tracking-wider">
                  Cumul des Cotisations
                </span>
                <div className="text-2xl sm:text-3xl font-black mt-0.5">
                  {formatMontant(totalPaidAmount, devise)}
                </div>
              </div>

              <div className="text-right">
                {totalLateMonths === 0 ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-black">
                    ⭐ À jour (100%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-rose-500/80 text-white px-3 py-1 rounded-full text-xs font-black shadow-sm">
                    ⚠️ {totalLateMonths} mois à verser
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-emerald-500/30 text-xs">
              <div>
                <span className="text-emerald-200/80">Mois réglés ({yearFilter}) :</span>
                <p className="font-extrabold text-sm text-white">{totalPaidMonths} sur 12 mois</p>
              </div>
              <div>
                <span className="text-emerald-200/80">Reste à recouvrer :</span>
                <p className="font-extrabold text-sm text-rose-200">{formatMontant(totalDueAmount, devise)}</p>
              </div>
            </div>
          </div>

          {/* Action CTAs: WhatsApp & PDF Export */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleSendFullRecap}
              className="w-full py-3 px-3 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Relevé WhatsApp</span>
            </button>

            <button
              onClick={() => exporterFicheMembrePDF(membre, membre.paiements, yearFilter, nomVillage, devise)}
              className="w-full py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger Fiche PDF</span>
            </button>
          </div>

          {/* Month-by-Month Detail List */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Calendrier des 12 Mois ({yearFilter})
              </h4>
              <span className="text-[11px] text-slate-400 font-bold">
                {totalPaidMonths} payés • {totalLateMonths} en retard
              </span>
            </div>

            <div className="space-y-2">
              {monthsDetail.map((m) => {
                const nomMois = formatMoisFrancais(m.mois);

                return (
                  <div
                    key={m.mois}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                      m.isPaid
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : m.isLate
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          m.isPaid
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : m.isLate
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {m.isPaid ? '✓' : m.monthIndex}
                      </div>

                      <div>
                        <p className="font-extrabold text-sm capitalize">{nomMois}</p>
                        <p className="text-[11px] font-medium opacity-80">
                          {m.isPaid
                            ? `Encaissement : ${m.payment?.encaisseur || 'Trésorier'} (${m.payment?.mode_paiement || 'Espèces'})`
                            : m.isLate
                            ? 'Cotisation en attente de paiement'
                            : 'Mois à venir'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {m.isPaid ? (
                        <button
                          onClick={() => m.payment && onViewReceipt(m.payment)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-extrabold text-xs shadow-sm hover:bg-emerald-100 transition-colors"
                        >
                          Reçu 📄
                        </button>
                      ) : canCollectPayments ? (
                        <button
                          onClick={() => onOpenPaymentForMonth(membre.id, m.mois)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 transition-all"
                        >
                          Encaisser 💵
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Non réglé</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
