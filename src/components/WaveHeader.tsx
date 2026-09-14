'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { ShieldCheck, Smartphone, Download, LogOut } from 'lucide-react';

interface WaveHeaderProps {
  onOpenAdmin: () => void;
  onOpenExport: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const WaveHeader: React.FC<WaveHeaderProps> = ({
  onOpenAdmin,
  onOpenExport,
  deferredPrompt,
  onInstallPwa,
}) => {
  const { currentUser, role, isAdmin, logout } = useAuth();
  const { nomVillage } = useData();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between gap-1.5">
        {/* Logo & Subtitle */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8.5 h-8.5 sm:w-9 sm:h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 shadow-sm">
            🏛️
          </div>
          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight truncate">
              {nomVillage}
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate max-w-[95px] sm:max-w-[130px]">
              {currentUser?.nom || 'Registre Numérique'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1 transition-transform active:scale-95"
              title="Installer l'application"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-transform active:scale-95"
            title="Exporter Bilan PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
            {role === 'admin' ? '🛡️ Admin' : role === 'tresorier' ? '💰 Trésorier' : '👁️ Bureau'}
          </span>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-transform active:scale-95"
              title="Gérer les comptes et accès"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-transform active:scale-95"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

