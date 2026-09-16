'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types';
import { ShieldCheck, UserPlus, X, Check, AlertCircle } from 'lucide-react';

interface UsersAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsersAdminModal: React.FC<UsersAdminModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, addUser, updateUserRole, toggleUserStatus, currentUser } = useAuth();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('membre_bureau');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!nom.trim() || !email.trim()) {
      setError('Tous les champs sont requis.');
      return;
    }

    const exists = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (exists) {
      setError('Un compte avec cette adresse email existe déjà.');
      return;
    }

    await addUser({
      nom: nom.trim(),
      email: email.trim().toLowerCase(),
      role,
      actif: true,
    });

    setNom('');
    setEmail('');
    setRole('membre_bureau');
    setSuccess('Nouveau compte créé avec succès.');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col animate-slideUp">
        {/* Modal Header — Emerald Theme */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-white/20 backdrop-blur shadow-sm">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">Administration des Rôles</h3>
              <p className="text-xs text-emerald-100 font-medium">Contrôle d&apos;accès du comité du village</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Create User Form */}
          <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-emerald-600" /> Ajouter un nouveau membre au comité
            </h4>

            {error && (
              <div className="mb-3 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0 text-emerald-600" /> {success}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">Nom complet</label>
                  <input
                    type="text"
                    placeholder="Ex: Oumar Ndiaye"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none bg-white font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">Email / Identifiant</label>
                  <input
                    type="email"
                    placeholder="oumar@village.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none bg-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1">Rôle attribué</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white cursor-pointer"
                  >
                    <option value="admin">• Administrateur (Accès total)</option>
                    <option value="tresorier">• Trésorier (Cotisations & Dépenses)</option>
                    <option value="membre_bureau">• Consultation (Lecture seule)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Ajouter le compte</span>
                </button>
              </div>
            </form>
          </div>

          {/* User List */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 px-1">
              Comptes d&apos;accès existants ({users.length})
            </h4>

            <div className="space-y-2.5">
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      u.actif
                        ? 'bg-white border-slate-200/80 shadow-xs'
                        : 'bg-slate-100/70 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-extrabold text-sm text-slate-900 truncate">{u.nom}</span>
                        {isSelf && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-black px-2 py-0.2 rounded-full">
                            Vous
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-medium truncate mt-0.5">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <select
                        value={u.role}
                        disabled={isSelf}
                        onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                        className="flex-1 sm:flex-initial px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold bg-slate-50 text-slate-800 disabled:opacity-75 cursor-pointer focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="admin">Admin</option>
                        <option value="tresorier">Trésorier</option>
                        <option value="membre_bureau">Consultation</option>
                      </select>

                      {!isSelf && (
                        <button
                          onClick={() => toggleUserStatus(u.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-black transition-all flex-shrink-0 ${
                            u.actif
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                          }`}
                        >
                          {u.actif ? 'Désactiver' : 'Réactiver'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-extrabold text-xs hover:bg-slate-100 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
