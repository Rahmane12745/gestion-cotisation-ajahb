'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { genererPointCommunaute, partagerSurWhatsApp, formatMoisFrancais } from '@/lib/whatsappUtils';
import { MessageSquare, MessageCircle, Copy, Check, X, Sparkles } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const { stats, selectedMonth, nomVillage, devise } = useData();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const broadcastText = genererPointCommunaute(stats, selectedMonth, nomVillage, devise);

  const handleShare = () => {
    partagerSurWhatsApp(broadcastText, undefined, `Point Cotisations ${formatMoisFrancais(selectedMonth)}`);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(broadcastText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden text-left p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Communiqué Groupe WhatsApp</h3>
              <p className="text-xs text-slate-500">Point mensuel prêt à diffuser</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Message preview */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 font-sans text-xs whitespace-pre-line text-slate-700 max-h-64 overflow-y-auto leading-relaxed shadow-inner">
          {broadcastText}
        </div>

        {/* Action buttons */}
        <div className="space-y-2 pt-1">
          <button
            onClick={handleShare}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Partager dans le Groupe WhatsApp</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Texte copié !' : 'Copier le texte du message'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
