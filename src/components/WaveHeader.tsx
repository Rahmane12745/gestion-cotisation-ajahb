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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo simple */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
            🏛️
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight">
              {nomVillage}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
              {currentUser?.nom || 'Registre Numérique'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className="p-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold flex items-center gap-1"
              title="Installer l'application"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={onOpenExport}
            className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title="Exporter Bilan PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {role === 'admin' ? '🛡️ Admin' : role === 'tresorier' ? '💰 Trésorier' : '👁️ Bureau'}
          </span>

          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Gérer les comptes et accès"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </button>
          )}

          <button
            onClick={logout}
            className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            title="Déconnexion"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
