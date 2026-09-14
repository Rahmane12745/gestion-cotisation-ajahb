'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { WaveHeader } from '@/components/WaveHeader';
import { WaveDashboard } from '@/components/WaveDashboard';
import { WaveMemberListTab } from '@/components/WaveMemberListTab';
import { WaveMemberDetail } from '@/components/WaveMemberDetail';
import { WaveJournal } from '@/components/WaveJournal';
import { WavePaymentModal } from '@/components/WavePaymentModal';
import { WaveMemberModal } from '@/components/WaveMemberModal';
import { WaveReceiptModal } from '@/components/WaveReceiptModal';
import { ExportModal } from '@/components/ExportModal';
import { UsersAdminModal } from '@/components/UsersAdminModal';
import { BroadcastModal } from '@/components/BroadcastModal';
import { SanctionModal } from '@/components/SanctionModal';
import { DepenseModal } from '@/components/DepenseModal';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { LoginPage } from '@/components/LoginPage';
import { MembreWithStats, Paiement, Membre } from '@/types';
import { Home as HomeIcon, Users as UsersIcon, Receipt, Plus } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading, loginWithEmail } = useAuth();
  const { membresWithStats } = useData();

  // Navigation tab: 'home' | 'membres' | 'journal'
  const [activeTab, setActiveTab] = useState<'home' | 'membres' | 'journal'>('home');

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

    // Mettre à jour la fiche sélectionnée si ouverte
    if (selectedMember) {
      const updated = membresWithStats.find((m) => m.id === selectedMember.id);
      if (updated) setSelectedMember(updated);
    }
  };

  // Écran de chargement initial
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-sm font-semibold text-emerald-400">Chargement de l'application...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion si non authentifié
  if (!isAuthenticated) {
    return <LoginPage onLogin={loginWithEmail} isLoading={authLoading} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Centered Mobile-first Shell with Desktop backdrop */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-[#F4F6F8] flex flex-col shadow-2xl relative border-x border-slate-200/50">
        {/* 1. Header Minimaliste & Haut de gamme */}
        <WaveHeader
          onOpenAdmin={() => setIsAdminOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          deferredPrompt={deferredPrompt}
          onInstallPwa={handleInstallPwa}
        />

        {/* 2. Écran Principal */}
        <main className="flex-1 w-full px-4 pt-4 pb-24">
          {activeTab === 'home' && (
            <WaveDashboard
              onOpenPayment={(id) => handleOpenPayment(id)}
              onOpenBroadcast={() => setIsBroadcastOpen(true)}
              onOpenDepense={() => setIsDepenseModalOpen(true)}
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
        </main>

        {/* 3. Barre de navigation Wave en bas */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur border-t border-slate-200/80 shadow-2xl py-2 px-4">
          <div className="flex items-center justify-around">
            {/* Onglet Accueil */}
            <button
              onClick={() => {
                setActiveTab('home');
                setSelectedMember(null);
              }}
              className={`flex flex-col items-center gap-1 text-xs font-black transition-all ${
                activeTab === 'home'
                  ? 'text-emerald-600 scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-2xl ${activeTab === 'home' ? 'bg-emerald-50' : ''}`}>
                <HomeIcon className="w-5 h-5" />
              </div>
              <span>Accueil</span>
            </button>

            {/* Onglet Membres */}
            <button
              onClick={() => setActiveTab('membres')}
              className={`flex flex-col items-center gap-1 text-xs font-black transition-all ${
                activeTab === 'membres'
                  ? 'text-emerald-600 scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-2xl ${activeTab === 'membres' ? 'bg-emerald-50' : ''}`}>
                <UsersIcon className="w-5 h-5" />
              </div>
              <span>Membres</span>
            </button>

            {/* Gros Bouton Central Encaisser */}
            <button
              onClick={() => handleOpenPayment()}
              className="flex flex-col items-center -mt-6 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 active:scale-90 text-white p-4 rounded-full shadow-xl shadow-emerald-600/40 transition-all border-4 border-[#F4F6F8]"
              title="Encaisser"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* Onglet Historique */}
            <button
              onClick={() => {
                setActiveTab('journal');
                setSelectedMember(null);
              }}
              className={`flex flex-col items-center gap-1 text-xs font-black transition-all ${
                activeTab === 'journal'
                  ? 'text-emerald-600 scale-105'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-2xl ${activeTab === 'journal' ? 'bg-emerald-50' : ''}`}>
                <Receipt className="w-5 h-5" />
              </div>
              <span>Historique</span>
            </button>
          </div>
        </nav>

        {/* 4. Fiche détaillée du membre (12 mois + encaissement direct + actions admin) */}
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

        {/* Modales */}
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

