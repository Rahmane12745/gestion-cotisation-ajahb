'use client';

import React, { useState } from 'react';
import { Membre, Paiement } from '@/types';
import { useData } from '@/context/DataContext';
import { formatMoisFrancais, formatMontant, genererTexteRecu, partagerSurWhatsApp } from '@/lib/whatsappUtils';
import { CheckCircle2, MessageCircle, Copy, Check, Printer, X, Share2 } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: Paiement | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
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
      `Reçu Cotisation ${formatMoisFrancais(paiement.mois)} - ${membre.nom}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(receiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-200" />
            <h3 className="font-bold text-lg">Reçu de Versement Officiel</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Body */}
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 font-mono text-xs space-y-2 relative">
            <div className="text-center border-b border-dashed border-slate-300 pb-2">
              <p className="font-bold text-sm text-slate-800 uppercase">{nomVillage}</p>
              <p className="text-[11px] text-slate-500">Registre Numérique Centralisé</p>
            </div>

            <div className="pt-1 flex justify-between">
              <span className="text-slate-500">N° Reçu :</span>
              <span className="font-bold text-slate-800">{paiement.reference_recu || paiement.id.slice(0, 8).toUpperCase()}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Membre :</span>
              <span className="font-bold text-slate-900">{membre.nom}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Matricule :</span>
              <span className="font-bold text-emerald-700">{membre.matricule}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Téléphone :</span>
              <span className="text-slate-800">{membre.telephone}</span>
            </div>

            {membre.quartier && (
              <div className="flex justify-between">
                <span className="text-slate-500">Quartier :</span>
                <span className="text-slate-800">{membre.quartier}</span>
              </div>
            )}

            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between">
              <span className="text-slate-500">Mois Cotisé :</span>
              <span className="font-bold text-slate-900">{formatMoisFrancais(paiement.mois)}</span>
            </div>

            <div className="flex justify-between items-center text-sm py-1 bg-emerald-100/60 px-2 rounded-lg text-emerald-950 font-sans">
              <span className="font-bold">Montant Versé :</span>
              <span className="font-extrabold text-base text-emerald-800">{formatMontant(paiement.montant, devise)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Mode :</span>
              <span className="text-slate-800">{paiement.mode_paiement || 'Espèces'}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Encaissé par :</span>
              <span className="text-slate-800">{paiement.encaisseur}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Date & Heure :</span>
              <span className="text-slate-700">{new Date(paiement.date_paiement).toLocaleString('fr-FR')}</span>
            </div>

            <div className="border-t border-dashed border-slate-300 pt-2 text-center text-[10px] text-emerald-700 font-sans font-medium">
              ✅ Paiement enregistré et certifié dans la base de données.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            {/* Direct WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all"
            >
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>Envoyer le Reçu par WhatsApp</span>
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Reçu Copié !' : 'Copier le texte'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                title="Imprimer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
