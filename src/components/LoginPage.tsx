'use client';

import React, { useState } from 'react';
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, isLoading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onLogin(email.trim(), password);
      if (!result.success) {
        setError(result.error || 'Identifiants incorrects.');
      }
    } catch {
      setError('Erreur de connexion. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loading = isLoading || isSubmitting;

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a]">
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col shadow-2xl relative border-x border-slate-800">
        {/* Partie haute — Photo du Village Hero avec overlay vert */}
        <div className="relative min-h-[230px] px-6 pt-14 pb-14 flex flex-col items-center justify-center overflow-hidden">
          {/* Image du Village */}
          <img
            src="/village.jpg"
            alt="Photo du Village AJAHB"
            className="absolute inset-0 w-full h-full object-cover scale-105"
          />
          {/* Overlay vert gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 via-emerald-950/80 to-emerald-900/95" />
          
          {/* Icône shield */}
          <div className="relative z-10 w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-xl border border-white/30 animate-[popIn_0.6s_ease-out]">
            <Shield className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>
          
          {/* Titre */}
          <h1 className="relative z-10 text-white text-2xl sm:text-3xl font-black tracking-tight text-center drop-shadow-md animate-[slideUp_0.5s_ease-out]">
            AJAHB
          </h1>
          <p className="relative z-10 text-emerald-100 text-xs sm:text-sm font-bold mt-1 text-center animate-[slideUp_0.6s_ease-out]">
            Registre des Cotisations du Village
          </p>
        </div>

        {/* Partie basse — Formulaire */}
        <div className="flex-1 bg-[#F4F6F8] rounded-t-3xl -mt-6 relative z-10 px-6 pt-8 pb-8 flex flex-col animate-[slideUp_0.4s_ease-out]">
          <h2 className="text-slate-800 text-lg font-bold mb-1">Connexion</h2>
          <p className="text-slate-400 text-sm mb-6">Connectez-vous avec vos identifiants</p>

          <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
            {/* Champ Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="votre@email.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-2xl flex items-center gap-2 animate-[popIn_0.3s_ease-out]">
                <div className="w-2 h-2 bg-red-500 rounded-full shrink-0" />
                {error}
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1 min-h-[20px]" />

            {/* Bouton de connexion */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 disabled:from-slate-300 disabled:to-slate-300 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connexion en cours...
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center space-y-1">
            <p className="text-xs text-slate-400">
              Association des Jeunes et Amis du Village (AJAHB)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
