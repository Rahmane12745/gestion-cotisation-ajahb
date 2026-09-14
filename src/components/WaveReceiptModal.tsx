'use client';

import React, { useState } from 'react';
import { Membre, Paiement } from '@/types';
import { useData } from '@/context/DataContext';
import { formatMoisFrancais, formatMontant, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import { Check, MessageCircle, Share2, X, Copy, Printer, Sparkles } from 'lucide-react';

interface WaveReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: Paiement | null;
}

export const WaveReceiptModal: React.FC<WaveReceiptModalProps> = ({
  isOpen,
  onClose,
  paiement,
}) => {
  const { membres, devise, nomVillage } = useData();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !paiement) return null;

  const membre = membres.find((m) => m.id === paiement.membre_id);
  if (!membre) return null;

  const receiptText = genererTexteRecu(membre, paiement, devise, nomVillage);

  const handleShareWhatsApp = async () => {
    await partagerSurWhatsApp(
      receiptText,
      membre.telephone,
      `Reçu Cotisation ${membre.nom}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full shadow-2xl border border-slate-100 overflow-hidden text-center p-6 space-y-5 animate-popIn">
        {/* Animated Checkmark Circle */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-emerald-600/30">
            ✓
          </div>
        </div>

        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Paiement Validé !</h3>
          <p className="text-xs text-slate-500 font-mono font-bold mt-0.5">
            N° {paiement.reference_recu || paiement.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Big Summary Amount Box */}
        <div className="bg-slate-50 rounded-3xl p-4 border border-slate-200/80 space-y-2 text-left shadow-inner">
          <div className="flex justify-between items-baseline pb-2 border-b border-dashed border-slate-200">
            <span className="text-xs text-slate-500 font-medium">Montant Versé :</span>
            <span className="text-2xl font-black text-emerald-700">
              {formatMontant(paiement.montant, devise)}
            </span>
          </div>

          <div className="flex justify-between text-xs pt-1">
            <span className="text-slate-500">Membre :</span>
            <span className="font-extrabold text-slate-900">{membre.nom}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Matricule :</span>
            <span className="font-mono font-bold text-slate-700">{membre.matricule}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mois Cotisé :</span>
            <span className="font-extrabold text-slate-900">{formatMoisFrancais(paiement.mois)}</span>
          </div>

          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Mode :</span>
            <span className="font-semibold text-slate-800">{paiement.mode_paiement || 'Espèces'}</span>
          </div>

          <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-200/60">
            <span>Encaissé par : {paiement.encaisseur}</span>
            <span>{new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Big WhatsApp CTA Button */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Envoyer le reçu sur WhatsApp</span>
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copié !' : 'Copier texte'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
