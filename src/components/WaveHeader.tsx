'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Smartphone, LogOut } from 'lucide-react';

interface WaveHeaderProps {
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const WaveHeader: React.FC<WaveHeaderProps> = ({
  deferredPrompt,
  onInstallPwa,
}) => {
  const { currentUser, logout } = useAuth();
  const { nomVillage } = useData();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 py-3 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Village Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 text-white flex items-center justify-center font-black text-base flex-shrink-0 shadow-lg shadow-emerald-600/20">
            A
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 leading-tight truncate">
              {nomVillage}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate">
              {currentUser?.nom || 'Registre Numérique'}
            </p>
          </div>
        </div>

        {/* Header Actions — Minimal */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition-all active:scale-95"
              title="Installer l'application"
            >
              <Smartphone className="w-4.5 h-4.5" />
            </button>
          )}

          <button
            onClick={logout}
            className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-all active:scale-95"
            title="Déconnexion"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
