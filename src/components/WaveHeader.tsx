'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { Smartphone, LogOut } from 'lucide-react';

interface WaveHeaderProps {
  onOpenProfile: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const WaveHeader: React.FC<WaveHeaderProps> = ({
  onOpenProfile,
  deferredPrompt,
  onInstallPwa,
}) => {
  const { currentUser, logout } = useAuth();
  const { nomVillage } = useData();

  const initials = (currentUser?.nom || nomVillage || 'AJ').slice(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-slate-100 px-4 py-3 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo & Profile Clickable Block */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-3 min-w-0 text-left group hover:opacity-85 active:scale-95 transition-all cursor-pointer"
          title="Appuyez pour modifier votre profil"
        >
          {currentUser?.photo ? (
            <img
              src={currentUser.photo}
              alt={currentUser.nom}
              className="w-10 h-10 rounded-2xl object-cover border-2 border-emerald-500 shadow-md group-hover:scale-105 transition-transform flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-lg shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              {initials}
            </div>
          )}

          <div className="min-w-0">
            <h1 className="text-sm font-black text-slate-900 leading-tight truncate">
              {nomVillage}
            </h1>
            <p className="text-[11px] text-emerald-700 font-bold truncate flex items-center gap-1">
              <span>{currentUser?.nom || 'Mon Profil'}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-extrabold">Éditer</span>
            </p>
          </div>
        </button>

        {/* Header Actions */}
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
