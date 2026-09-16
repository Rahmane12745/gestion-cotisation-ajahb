'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import {
  Users,
  CreditCard,
  LayoutDashboard,
  ShieldCheck,
  UserCheck,
  Download,
  PlusCircle,
  Smartphone,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'dashboard' | 'membres' | 'paiements';
  setActiveTab: (tab: 'dashboard' | 'membres' | 'paiements') => void;
  onOpenPaymentModal: () => void;
  onOpenMemberModal: () => void;
  onOpenExportModal: () => void;
  onOpenAdminModal: () => void;
  deferredPrompt: any;
  onInstallPwa: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPaymentModal,
  onOpenMemberModal,
  onOpenExportModal,
  onOpenAdminModal,
  deferredPrompt,
  onInstallPwa,
}) => {
  const { role, canCollectPayments, canEditMembers, isAdmin, logout } = useAuth();
  const { nomVillage } = useData();

  const getRoleBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200/50 shadow-sm">
            <ShieldCheck className="w-4 h-4" /> Admin
          </span>
        );
      case 'tresorier':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-100 to-teal-50 text-emerald-700 border border-emerald-200/50 shadow-sm">
            <UserCheck className="w-4 h-4" /> Trésorier
          </span>
        );
      case 'membre_bureau':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200/50 shadow-sm">
            <Users className="w-4 h-4" /> Bureau
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/98 backdrop-blur-xl border-b border-slate-100 shadow-lg">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300 transform group-hover:scale-105">
              <span className="text-xl">🏛️</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent leading-tight">
                {nomVillage}
              </h1>
              <p className="text-xs text-slate-500 font-semibold hidden xs:block tracking-wide">
                Registre Cotisations
              </p>
            </div>
          </div>

          {/* Quick Actions for Cashier / Admin */}
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={onInstallPwa}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-teal-50 to-cyan-50 text-teal-700 hover:from-teal-100 hover:to-cyan-100 border border-teal-200/50 transition-all duration-300 shadow-sm hover:shadow-teal-200/30"
                title="Installer sur l'ordinateur ou téléphone"
              >
                <Smartphone className="w-4 h-4" />
                <span>Installer</span>
              </button>
            )}

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200/50 transition-all duration-300 shadow-sm"
              title="Exporter Excel ou PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {canEditMembers && (
              <button
                onClick={onOpenMemberModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 shadow-md shadow-emerald-500/25 hover:shadow-emerald-500/40 transform hover:scale-105"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Membre</span>
              </button>
            )}

            {canCollectPayments && (
              <button
                onClick={onOpenPaymentModal}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-bold rounded-lg text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/50 transform hover:scale-105"
              >
                <CreditCard className="w-4 h-4" />
                <span>Encaisser</span>
              </button>
            )}

            {/* Role Badge */}
            <div className="pl-1 hidden sm:block">
              {getRoleBadge()}
            </div>

            {/* Admin panel button */}
            {isAdmin && (
              <button
                onClick={onOpenAdminModal}
                className="p-1.5 rounded-lg text-slate-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 transition-all duration-300 shadow-sm hover:shadow-red-200/30"
                title="Gérer les comptes et accès"
              >
                <ShieldCheck className="w-5 h-5" />
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/50 transition-all duration-300 shadow-sm hover:shadow-red-200/30"
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-t border-slate-100 gap-2 sm:gap-6 overflow-x-auto no-scrollbar py-2 text-sm font-medium">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-600" />
            <span>Tableau de bord</span>
          </button>

          <button
            onClick={() => setActiveTab('membres')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'membres'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Membres & Cotisations</span>
          </button>

          <button
            onClick={() => setActiveTab('paiements')}
            className={`flex items-center gap-2 py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'paiements'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-indigo-600" />
            <span>Journal des paiements</span>
          </button>
        </div>
      </div>
    </header>
  );
};
