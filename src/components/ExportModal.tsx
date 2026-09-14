'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import {
  exporterBilanMensuelPDF,
  exporterJournalPaiementsPDF,
  exporterRegistreMembresPDF
} from '@/lib/exportUtils';
import { FileText, Download, Check, X, Calendar, Users, Receipt, ShieldCheck } from 'lucide-react';
import { formatMoisFrancais } from '@/lib/whatsappUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { membresWithStats, paiements, membres, selectedMonth, stats, nomVillage } = useData();
  const [downloading, setDownloading] = useState<string | null>(null);

  if (!isOpen) return null;

  const membresMap = new Map(membres.map((m) => [m.id, m]));

  const handleExportBilanMensuel = () => {
    setDownloading('bilan-mensuel');
    try {
      exporterBilanMensuelPDF(membresWithStats, selectedMonth, stats.totalCollecteMois, nomVillage);
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  };

  const handleExportJournal = () => {
    setDownloading('journal-paiements');
    try {
      exporterJournalPaiementsPDF(paiements, membresMap, nomVillage);
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  };

  const handleExportRegistre = () => {
    setDownloading('registre-membres');
    try {
      exporterRegistreMembresPDF(membresWithStats, nomVillage);
    } finally {
      setTimeout(() => setDownloading(null), 1200);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all animate-slideUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-black text-lg leading-tight">Rapports & Documents PDF</h3>
              <p className="text-xs text-emerald-200">Village {nomVillage} • Prêts pour impression</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Options */}
        <div className="p-5 space-y-3.5">
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Téléchargez les documents officiels de l'association au format PDF de haute qualité, formatés avec en-têtes officiels et blocs de signature pour les assemblées générales.
          </p>

          <div className="space-y-2.5">
            {/* 1. Bilan Mensuel PDF */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0 font-bold">
                  📄
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    Bilan Mensuel ({formatMoisFrancais(selectedMonth)})
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Indicateurs clés, membres à jour / en retard, signatures
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportBilanMensuel}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs transition-all whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {downloading === 'bilan-mensuel' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>PDF</span>
              </button>
            </div>

            {/* 2. Journal des Paiements PDF */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0 font-bold">
                  📋
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    Journal des Versements (PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Historique exhaustif de tous les reçus et paiements
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportJournal}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-black text-xs transition-all whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {downloading === 'journal-paiements' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>PDF</span>
              </button>
            </div>

            {/* 3. Registre Complet des Membres PDF */}
            <div className="p-3.5 rounded-2xl border border-slate-200/80 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center flex-shrink-0 font-bold">
                  👥
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">
                    Registre des Membres (PDF)
                  </h4>
                  <p className="text-[11px] text-slate-500 truncate">
                    Répertoire complet des matricules et cotisations annuelles
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportRegistre}
                disabled={downloading !== null}
                className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs transition-all whitespace-nowrap shadow-sm disabled:opacity-50"
              >
                {downloading === 'registre-membres' ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>PDF</span>
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-bold text-xs transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
