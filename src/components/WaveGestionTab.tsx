'use client';

import React from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatMontant } from '@/lib/whatsappUtils';
import {
  TrendingDown,
  User,
  FileBarChart,
  Radio,
  Wallet,
  ChevronRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Target,
} from 'lucide-react';

interface WaveGestionTabProps {
  onOpenDepense: () => void;
  onOpenAdmin: () => void;
  onOpenExport: () => void;
  onOpenBroadcast: () => void;
  onOpenProjets?: () => void;
  onOpenMyPortal?: () => void;
}

export const WaveGestionTab: React.FC<WaveGestionTabProps> = ({
  onOpenDepense,
  onOpenAdmin,
  onOpenExport,
  onOpenBroadcast,
  onOpenProjets,
  onOpenMyPortal,
}) => {
  const { stats, devise } = useData();
  const { isAdmin, isTresorier, role } = useAuth();
  const [showSolde, setShowSolde] = React.useState(true);

  const canManageExpenses = isAdmin || isTresorier;
  const canManageAccounts = isAdmin;

  const actions = [
    {
      id: 'projets',
      label: 'Projets & Collectes Spéciales',
      description: 'Projets du village (Puits, Événements, Travaux)',
      icon: Target,
      onClick: onOpenProjets,
      visible: !!onOpenProjets,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
    },
    {
      id: 'my_portal',
      label: 'Mon Espace Membre',
      description: 'Consulter mes cotisations personnelles & reçus',
      icon: User,
      onClick: onOpenMyPortal,
      visible: !!onOpenMyPortal,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
    },
    {
      id: 'depense',
      label: 'Dépenses',
      description: 'Enregistrer une dépense du village',
      icon: TrendingDown,
      onClick: onOpenDepense,
      visible: canManageExpenses,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
    },
    {
      id: 'accounts',
      label: 'Gestion des Comptes',
      description: 'Gérer les utilisateurs et accès',
      icon: ShieldCheck,
      onClick: onOpenAdmin,
      visible: canManageAccounts,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
    },
    {
      id: 'export',
      label: 'Exports PDF',
      description: 'Télécharger les rapports et bilans',
      icon: FileBarChart,
      onClick: onOpenExport,
      visible: true,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-700',
    },
    {
      id: 'broadcast',
      label: 'Diffusion WhatsApp',
      description: 'Partager le point dans le groupe',
      icon: Radio,
      onClick: onOpenBroadcast,
      visible: true,
      iconBg: 'bg-slate-100',
      iconColor: 'text-slate-700',
    },
  ];

  const visibleActions = actions.filter((a) => a.visible);

  return (
    <div className="max-w-md mx-auto space-y-5 pb-24 sm:pb-8 animate-slideUp">
      {/* Solde en Caisse Card */}
      <div className="relative rounded-3xl p-5 overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white shadow-2xl border border-slate-700/50">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Solde Net en Caisse</span>
            </div>
            <button
              onClick={() => setShowSolde(!showSolde)}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
            >
              {showSolde ? <Eye className="w-4 h-4 text-slate-300" /> : <EyeOff className="w-4 h-4 text-slate-300" />}
            </button>
          </div>

          <div className="text-3xl font-black tracking-tight">
            {showSolde ? formatMontant(stats.soldeNetCaisse, devise) : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-700/50">
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Collect\u00e9</p>
              <p className="text-sm font-bold text-emerald-400">
                {showSolde ? formatMontant(stats.totalCollecteAnnee, devise) : '\u2022\u2022\u2022\u2022'}
              </p>
            </div>
            <div className="w-px h-8 bg-slate-700" />
            <div className="flex-1">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">D\u00e9pens\u00e9</p>
              <p className="text-sm font-bold text-slate-300">
                {showSolde ? formatMontant(stats.totalDepensesAnnee, devise) : '\u2022\u2022\u2022\u2022'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="px-1">
        <h2 className="text-lg font-black text-slate-900">Gestion</h2>
        <p className="text-xs text-slate-500 font-medium">Outils d&apos;administration</p>
      </div>

      {/* Action Cards */}
      <div className="space-y-2.5">
        {visibleActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className="w-full bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex items-center gap-4 cursor-pointer active:scale-[0.99] group text-left"
            >
              <div className={`w-12 h-12 rounded-2xl ${action.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110`}>
                <Icon className={`w-6 h-6 ${action.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{action.description}</p>
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-emerald-50 text-slate-300 group-hover:text-emerald-600 flex items-center justify-center transition-colors flex-shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Role Info */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/50">
        <p className="text-xs text-slate-400 font-medium text-center">
          Connect\u00e9 en tant que <span className="font-bold text-slate-600">{role === 'admin' ? 'Administrateur' : role === 'tresorier' ? 'Tr\u00e9sorier' : role === 'membre' ? 'Membre' : 'Bureau'}</span>
        </p>
      </div>
    </div>
  );
};
