'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { UserProfile, UserRole } from '@/types';
import { ShieldCheck, UserPlus, UserCheck, Users, X, Check, AlertCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur">
              <ShieldCheck className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Espace Administration & Rôles</h3>
              <p className="text-xs text-red-100">Contrôle d'accès des membres du comité</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-red-100 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Create User Form */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200">
            <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-red-600" /> Créer un nouveau compte d'accès
            </h4>

            {error && (
              <div className="mb-3 p-3 rounded-xl bg-red-100 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {success && (
              <div className="mb-3 p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" /> {success}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  placeholder="Ex: Oumar Ndiaye"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email / Identifiant</label>
                <input
                  type="email"
                  placeholder="oumar@village.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rôle attribué</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-red-500 focus:outline-none bg-white"
                >
                  <option value="admin">🛡️ Administrateur</option>
                  <option value="tresorier">💰 Trésorier</option>
                  <option value="membre_bureau">👁️ Membre du bureau (Lecture)</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow transition-colors"
                >
                  Ajouter le compte
                </button>
              </div>
            </form>
          </div>

          {/* User List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Comptes existants ({users.length})
            </h4>

            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    u.actif ? 'bg-white border-slate-200' : 'bg-slate-100 border-slate-300 opacity-60'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{u.nom}</span>
                      {currentUser?.id === u.id && (
                        <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded-full">
                          Vous
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={u.role}
                      disabled={currentUser?.id === u.id}
                      onChange={(e) => updateUserRole(u.id, e.target.value as UserRole)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-slate-50 text-slate-800 disabled:opacity-75 cursor-pointer"
                    >
                      <option value="admin">🛡️ Admin</option>
                      <option value="tresorier">💰 Trésorier</option>
                      <option value="membre_bureau">👁️ Consultation</option>
                    </select>

                    {currentUser?.id !== u.id && (
                      <button
                        onClick={() => toggleUserStatus(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.actif
                            ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {u.actif ? 'Désactiver' : 'Réactiver'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-100"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
