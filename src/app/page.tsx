'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { WaveHeader } from '@/components/WaveHeader';
import { WaveDashboard } from '@/components/WaveDashboard';
import { WaveMemberListTab } from '@/components/WaveMemberListTab';
import { WaveMemberDetail } from '@/components/WaveMemberDetail';
import { WaveJournal } from '@/components/WaveJournal';
import { WaveGestionTab } from '@/components/WaveGestionTab';
import { WaveMemberPortal } from '@/components/WaveMemberPortal';
import { WavePaymentModal } from '@/components/WavePaymentModal';
import { WaveMemberModal } from '@/components/WaveMemberModal';
import { WaveReceiptModal } from '@/components/WaveReceiptModal';
import { ProfileModal } from '@/components/ProfileModal';
import { ExportModal } from '@/components/ExportModal';
import { UsersAdminModal } from '@/components/UsersAdminModal';
import { BroadcastModal } from '@/components/BroadcastModal';
import { SanctionModal } from '@/components/SanctionModal';
import { DepenseModal } from '@/components/DepenseModal';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { LoginPage } from '@/components/LoginPage';
import { MembreWithStats, Paiement, Membre } from '@/types';
import {
  LayoutDashboard,
  Users as UsersIcon,
  ClipboardList,
  Settings,
  Plus,
  User,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, role, loginWithEmail, logout } = useAuth();
  const { membresWithStats } = useData();

  // Navigation tab: 'home' | 'membres' | 'journal' | 'gestion' | 'portal'
  const [activeTab, setActiveTab] = useState<'home' | 'membres' | 'journal' | 'gestion' | 'portal'>('home');

  // Selected member for detail view
  const [selectedMember, setSelectedMember] = useState<MembreWithStats | null>(null);

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentDefaultMemberId, setPaymentDefaultMemberId] = useState<string | null>(null);
  const [paymentDefaultMonth, setPaymentDefaultMonth] = useState<string | null>(null);

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<Membre | null>(null);

  const [isSanctionOpen, setIsSanctionOpen] = useState(false);
  const [sanctionMember, setSanctionMember] = useState<Membre | null>(null);

  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Paiement | null>(null);

  const [isDepenseModalOpen, setIsDepenseModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  // PWA Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.error('Service Worker Registration Failed', err);
      });
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleOpenPayment = (memberId?: string, month?: string) => {
    setPaymentDefaultMemberId(memberId || null);
    setPaymentDefaultMonth(month || null);
    setIsPaymentOpen(true);
  };

  const handleOpenNewMember = () => {
    setMemberToEdit(null);
    setIsMemberModalOpen(true);
  };

  const handleEditMember = (m: Membre) => {
    setMemberToEdit(m);
    setIsMemberModalOpen(true);
  };

  const handleOpenSanction = (m: Membre) => {
    setSanctionMember(m);
    setIsSanctionOpen(true);
  };

  const handleViewReceipt = (paiement: Paiement) => {
    setReceiptPayment(paiement);
    setIsReceiptOpen(true);
  };

  const handlePaymentSuccess = (paiement: Paiement) => {
    setReceiptPayment(paiement);
    setIsReceiptOpen(true);

    if (selectedMember) {
      const updated = membresWithStats.find((m) => m.id === selectedMember.id);
      if (updated) setSelectedMember(updated);
    }
  };

  // Member portal tab state
  const [memberPortalTab, setMemberPortalTab] = useState<'cotisations' | 'profil'>('cotisations');

  // Loading screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Chargement...</p>
        </div>
      </div>
    );
  }

  // Login screen
  if (!isAuthenticated) {
    return <LoginPage onLogin={loginWithEmail} isLoading={authLoading} />;
  }

  // Si l'utilisateur connecté est un rôle "membre" simple, lui afficher le Portail Membre complet !
  if (role === 'membre') {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
        <div className="w-full max-w-md mx-auto min-h-screen bg-[#F5F6F8] flex flex-col shadow-2xl relative border-x border-slate-200/30">
          {/* Header */}
          <WaveHeader
            onOpenProfile={() => setMemberPortalTab('profil')}
            deferredPrompt={deferredPrompt}
            onInstallPwa={handleInstallPwa}
          />

          {/* Main Content */}
          <main className="flex-1 w-full px-4 pt-4 pb-24">
            <WaveMemberPortal
              portalTab={memberPortalTab}
              setPortalTab={setMemberPortalTab}
              onViewReceipt={handleViewReceipt}
              onLogout={logout}
            />
          </main>

          {/* Bottom Navigation (Membre) */}
          <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/98 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="flex items-center justify-around px-8 py-2">
              <button
                onClick={() => setMemberPortalTab('cotisations')}
                className={`flex flex-col items-center gap-1 py-1 px-5 rounded-2xl transition-all ${
                  memberPortalTab === 'cotisations'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${memberPortalTab === 'cotisations' ? 'bg-emerald-50' : ''}`}>
                  <ClipboardList className="w-5 h-5" strokeWidth={memberPortalTab === 'cotisations' ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-bold ${memberPortalTab === 'cotisations' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Cotisations
                </span>
              </button>

              <button
                onClick={() => setMemberPortalTab('profil')}
                className={`flex flex-col items-center gap-1 py-1 px-5 rounded-2xl transition-all ${
                  memberPortalTab === 'profil'
                    ? 'text-emerald-600 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${memberPortalTab === 'profil' ? 'bg-emerald-50' : ''}`}>
                  <User className="w-5 h-5" strokeWidth={memberPortalTab === 'profil' ? 2.5 : 2} />
                </div>
                <span className={`text-[11px] font-bold ${memberPortalTab === 'profil' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  Mon Profil
                </span>
              </button>
            </div>
          </nav>

          {/* Receipt Modal */}
          <WaveReceiptModal
            isOpen={isReceiptOpen}
            onClose={() => setIsReceiptOpen(false)}
            paiement={receiptPayment}
          />

          <PwaInstallPrompt
            deferredPrompt={deferredPrompt}
            onInstall={handleInstallPwa}
          />
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'home' as const, label: 'Accueil', icon: LayoutDashboard },
    { id: 'membres' as const, label: 'Membres', icon: UsersIcon },
    { id: 'journal' as const, label: 'Historique', icon: ClipboardList },
    { id: 'gestion' as const, label: 'Gestion', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#F5F6F8] flex flex-col shadow-2xl relative border-x border-slate-200/30">
        {/* Header */}
        <WaveHeader
          onOpenProfile={() => setIsProfileOpen(true)}
          deferredPrompt={deferredPrompt}
          onInstallPwa={handleInstallPwa}
        />

        {/* Main Content */}
        <main className="flex-1 w-full px-4 pt-4 pb-24">
          {activeTab === 'home' && (
            <WaveDashboard
              onOpenPayment={(id) => handleOpenPayment(id)}
              onSelectMember={(m) => setSelectedMember(m)}
              onViewReceipt={handleViewReceipt}
            />
          )}

          {activeTab === 'membres' && (
            <WaveMemberListTab
              onSelectMember={(m) => setSelectedMember(m)}
              onOpenNewMember={handleOpenNewMember}
            />
          )}

          {activeTab === 'journal' && (
            <WaveJournal onViewReceipt={handleViewReceipt} />
          )}

          {activeTab === 'gestion' && (
            <WaveGestionTab
              onOpenDepense={() => setIsDepenseModalOpen(true)}
              onOpenAdmin={() => setIsAdminOpen(true)}
              onOpenExport={() => setIsExportOpen(true)}
              onOpenBroadcast={() => setIsBroadcastOpen(true)}
              onOpenMyPortal={() => setActiveTab('portal')}
            />
          )}

          {activeTab === 'portal' && (
            <div className="space-y-3">
              <button
                onClick={() => setActiveTab('gestion')}
                className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1 mb-2"
              >
                ← Retour au tableau de bord
              </button>
              <WaveMemberPortal onViewReceipt={handleViewReceipt} />
            </div>
          )}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/98 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-around px-2 py-1.5">
            {navItems.slice(0, 2).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedMember(null);
                  }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}

            {/* Central FAB Button */}
            <button
              onClick={() => handleOpenPayment()}
              className="flex flex-col items-center -mt-7"
              title="Encaisser"
            >
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 active:scale-90 text-white p-3.5 rounded-2xl shadow-xl shadow-emerald-600/30 transition-all border-4 border-[#F5F6F8]">
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-0.5">Encaisser</span>
            </button>

            {navItems.slice(2, 4).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSelectedMember(null);
                  }}
                  className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-2xl transition-all ${
                    isActive
                      ? 'text-emerald-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <div className={`p-1.5 rounded-xl transition-colors ${isActive ? 'bg-emerald-50' : ''}`}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Member Detail */}
        {selectedMember && (
          <WaveMemberDetail
            membre={selectedMember}
            onClose={() => setSelectedMember(null)}
            onOpenPaymentForMonth={(membreId, mois) => handleOpenPayment(membreId, mois)}
            onViewReceipt={handleViewReceipt}
            onEditMember={(m) => handleEditMember(m)}
            onOpenSanction={(m) => handleOpenSanction(m)}
          />
        )}

        {/* Profile Modal */}
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
        />

        {/* Modals */}
        <WavePaymentModal
          isOpen={isPaymentOpen}
          onClose={() => setIsPaymentOpen(false)}
          defaultMemberId={paymentDefaultMemberId}
          defaultMonth={paymentDefaultMonth}
          onPaymentSuccess={handlePaymentSuccess}
        />

        <WaveMemberModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          memberToEdit={memberToEdit}
        />

        <DepenseModal
          isOpen={isDepenseModalOpen}
          onClose={() => setIsDepenseModalOpen(false)}
        />

        <SanctionModal
          isOpen={isSanctionOpen}
          onClose={() => setIsSanctionOpen(false)}
          membre={sanctionMember}
        />

        <WaveReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          paiement={receiptPayment}
        />

        <BroadcastModal
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
        />

        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />

        <UsersAdminModal
          isOpen={isAdminOpen}
          onClose={() => setIsAdminOpen(false)}
        />

        <PwaInstallPrompt
          deferredPrompt={deferredPrompt}
          onInstall={handleInstallPwa}
        />
      </div>
    </div>
  );
}
