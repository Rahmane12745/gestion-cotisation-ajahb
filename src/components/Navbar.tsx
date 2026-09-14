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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Administrateur
          </span>
        );
      case 'tresorier':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3.5 h-3.5" /> Trésorier
          </span>
        );
      case 'membre_bureau':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Users className="w-3.5 h-3.5" /> Consultation (Bureau)
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
              <span className="text-lg">🏛️</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {nomVillage}
              </h1>
              <p className="text-xs text-slate-500 font-medium hidden xs:block">
                Registre Numérique des Cotisations
              </p>
            </div>
          </div>

          {/* Quick Actions for Cashier / Admin */}
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <button
                onClick={onInstallPwa}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors"
                title="Installer sur l'ordinateur ou téléphone"
              >
                <Smartphone className="w-4 h-4" />
                <span>Installer l'app</span>
              </button>
            )}

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors shadow-sm"
              title="Exporter Excel ou PDF"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {canEditMembers && (
              <button
                onClick={onOpenMemberModal}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                <span>Nouveau membre</span>
              </button>
            )}

            {canCollectPayments && (
              <button
                onClick={onOpenPaymentModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/30"
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
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                title="Gérer les comptes et accès"
              >
                <ShieldCheck className="w-5 h-5 text-red-600" />
              </button>
            )}

            {/* Logout button */}
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
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
