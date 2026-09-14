'use client';

import React, { useState, useRef } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { MembreWithStats, Paiement } from '@/types';
import { formatMoisFrancais, formatMontant, formatTelephoneWhatsApp, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
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
  Sparkles
} from 'lucide-react';

interface WaveMemberDetailProps {
  membre: MembreWithStats;
  onClose: () => void;
  onOpenPaymentForMonth: (membreId: string, mois: string) => void;
  onViewReceipt: (paiement: Paiement) => void;
}

export const WaveMemberDetail: React.FC<WaveMemberDetailProps> = ({
  membre,
  onClose,
  onOpenPaymentForMonth,
  onViewReceipt,
}) => {
  const { selectedMonth, devise, montantCotisation, nomVillage, updateMembre } = useData();
  const { canCollectPayments, canEditMembers } = useAuth();

  const [yearFilter, setYearFilter] = useState(selectedMonth.split('-')[0] || '2026');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Envoi d'un récapitulatif complet par WhatsApp
  const handleSendFullRecap = () => {
    const payesList = monthsDetail.filter((m) => m.isPaid).map((m) => `✅ ${formatMoisFrancais(m.mois)}`).join('\n');
    const lateList = monthsDetail.filter((m) => m.isLate).map((m) => `❌ ${formatMoisFrancais(m.mois)}`).join('\n');

    const message =
      `*🏛️ ${nomVillage.toUpperCase()}*\n` +
      `*BILAN DE VOS COTISATIONS (${yearFilter})*\n` +
      `--------------------------------\n` +
      `👤 *Membre :* ${membre.nom}\n` +
      `🆔 *Matricule :* ${membre.matricule}\n` +
      `📞 *Téléphone :* ${membre.telephone}\n\n` +
      `💰 *Total versé :* ${formatMontant(totalPaidAmount, devise)} (${totalPaidMonths} mois)\n` +
      (totalDueAmount > 0
        ? `⚠️ *Reste en retard :* ${formatMontant(totalDueAmount, devise)} (${totalLateMonths} mois)\n\n`
        : `🎉 *Statut :* Félicitations, vous êtes 100% à jour !\n\n`) +
      `*Détail de vos mois (${yearFilter}) :*\n` +
      (payesList ? `${payesList}\n` : '') +
      (lateList ? `${lateList}\n` : '') +
      `\n_Merci pour votre engagement envers le village ${nomVillage}._`;

    partagerSurWhatsApp(message, membre.telephone, `Bilan Cotisations ${membre.nom}`);
  };

  const cleanPhone = formatTelephoneWhatsApp(membre.telephone);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden max-h-[92vh] flex flex-col animate-slideUp">
        {/* Header Style Wave avec Photo de Profil */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-2xl bg-white shadow-sm border border-slate-200/80 text-slate-700 flex items-center justify-center font-bold hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {/* Profile Avatar / Photo with optional change */}
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
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                  {membre.nom}
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

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
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

          {/* WhatsApp Share Full Recap CTA */}
          <button
            onClick={handleSendFullRecap}
            className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Envoyer le relevé complet sur WhatsApp</span>
          </button>

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

                if (m.isPaid) {
                  // Payé
                  return (
                    <div
                      key={m.mois}
                      className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/90 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xs font-black shadow-sm">
                          ✓
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-900">{nomMois}</p>
                          <p className="text-[11px] text-emerald-800 font-semibold">
                            Payé le {m.payment ? new Date(m.payment.date_paiement).toLocaleDateString('fr-FR') : ''} • {formatMontant(m.payment?.montant || montantCotisation, devise)}
                          </p>
                        </div>
                      </div>

                      {m.payment && (
                        <button
                          onClick={() => onViewReceipt(m.payment!)}
                          className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                          title="Voir le reçu WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reçu</span>
                        </button>
                      )}
                    </div>
                  );
                } else if (m.isLate) {
                  // En Retard (Action directe pour encaisser ce mois précis !)
                  return (
                    <div
                      key={m.mois}
                      className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200/90 flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center text-xs font-black">
                          !
                        </div>
                        <div>
                          <p className="font-black text-sm text-slate-900">{nomMois}</p>
                          <p className="text-[11px] text-rose-700 font-extrabold">
                            Non payé ({formatMontant(montantCotisation, devise)})
                          </p>
                        </div>
                      </div>

                      {canCollectPayments && (
                        <button
                          onClick={() => onOpenPaymentForMonth(membre.id, m.mois)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Encaisser {nomMois.split(' ')[0]}</span>
                        </button>
                      )}
                    </div>
                  );
                } else {
                  // Mois futur
                  return (
                    <div
                      key={m.mois}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200/60 flex items-center justify-between text-slate-400 opacity-70"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">
                          •
                        </div>
                        <span className="font-bold text-xs text-slate-600">{nomMois}</span>
                      </div>

                      {canCollectPayments && (
                        <button
                          onClick={() => onOpenPaymentForMonth(membre.id, m.mois)}
                          className="text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:underline px-2.5 py-1"
                        >
                          Payer d'avance
                        </button>
                      )}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
