'use client';

import React, { useState } from 'react';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import { formatMontant } from '@/lib/whatsappUtils';
import { Target, Plus, Check, HeartHandshake, X } from 'lucide-react';

interface ProjetsSpeciauxModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjetsSpeciauxModal: React.FC<ProjetsSpeciauxModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { projetsSpeciaux, cotisationsProjets, addProjetSpecial, addCotisationProjet, membres, devise, nomVillage } = useData();
  const { canCollectPayments, isAdmin, currentUser } = useAuth();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [objectif, setObjectif] = useState('');
  const [error, setError] = useState('');

  // Saisie versement projet
  const [selectedProjetId, setSelectedProjetId] = useState<string | null>(null);
  const [selectedMembreId, setSelectedMembreId] = useState('');
  const [montantVersement, setMontantVersement] = useState('');
  const [modePaiement, setModePaiement] = useState('Espèces');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const objNum = Number(objectif);
    if (!titre.trim() || isNaN(objNum) || objNum <= 0) {
      setError('Veuillez remplir un titre et un objectif valide.');
      return;
    }

    const res = await addProjetSpecial({
      titre: titre.trim(),
      description: description.trim() || undefined,
      objectif_montant: objNum,
    });

    if (res.success) {
      setTitre('');
      setDescription('');
      setObjectif('');
      setShowCreateForm(false);
    } else {
      setError(res.error || 'Erreur lors de la création');
    }
  };

  const handleVersementProjet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjetId || !selectedMembreId || !montantVersement) return;

    setIsSubmitting(true);
    const res = await addCotisationProjet({
      projet_id: selectedProjetId,
      membre_id: selectedMembreId,
      montant: Number(montantVersement),
      encaisseur: currentUser?.nom || 'Trésorier',
      mode_paiement: modePaiement,
    });
    setIsSubmitting(false);

    if (res.success) {
      setSelectedProjetId(null);
      setSelectedMembreId('');
      setMontantVersement('');
    } else {
      alert(res.error || 'Erreur versement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[90vh] flex flex-col animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 text-white p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/20 backdrop-blur shadow-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">Projets & Collectes Spéciales</h3>
              <p className="text-xs text-emerald-100 font-medium">Cotisations d&apos;urgence & projets du village {nomVillage}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Action Create Project Button */}
          {isAdmin && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Créer un nouveau projet de collecte</span>
            </button>
          )}

          {/* Form Create Project */}
          {showCreateForm && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-black text-xs uppercase tracking-wider text-slate-800">Nouveau Projet du Village</h4>
                <button onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">Annuler</button>
              </div>

              {error && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">{error}</div>}

              <form onSubmit={handleCreateProjet} className="space-y-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Titre du projet *</label>
                  <input
                    type="text"
                    placeholder="Ex: Construction Puits du Quartier Nord"
                    value={titre}
                    onChange={(e) => setTitre(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Description (optionnelle)</label>
                  <input
                    type="text"
                    placeholder="Détails du projet..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">Objectif Financier ({devise}) *</label>
                  <input
                    type="number"
                    placeholder="Ex: 500000"
                    value={objectif}
                    onChange={(e) => setObjectif(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md hover:bg-emerald-700 transition-all"
                >
                  Lancer le projet
                </button>
              </form>
            </div>
          )}

          {/* List of Projects */}
          <div className="space-y-3">
            {projetsSpeciaux.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-3xl border border-slate-200/80 text-slate-400 text-xs font-medium">
                Aucun projet spécial en cours pour le moment.
              </div>
            ) : (
              projetsSpeciaux.map((proj) => {
                const collecte = Number(proj.collecte_actuelle || 0);
                const obj = Number(proj.objectif_montant || 1);
                const pct = Math.min(100, Math.round((collecte / obj) * 100));

                return (
                  <div key={proj.id} className="p-4 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">{proj.titre}</h4>
                        {proj.description && <p className="text-xs text-slate-500 font-medium mt-0.5">{proj.description}</p>}
                      </div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                        {pct}% réalisé
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-700">{formatMontant(collecte, devise)} collectés</span>
                        <span className="text-slate-400">Objectif: {formatMontant(obj, devise)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Contribution */}
                    {canCollectPayments && (
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <button
                          onClick={() => setSelectedProjetId(selectedProjetId === proj.id ? null : proj.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-sm flex items-center gap-1.5 transition-all"
                        >
                          <HeartHandshake className="w-4 h-4" />
                          <span>Enregistrer une contribution</span>
                        </button>
                      </div>
                    )}

                    {/* Versement Form inline */}
                    {selectedProjetId === proj.id && (
                      <form onSubmit={handleVersementProjet} className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5 mt-2 animate-fadeIn">
                        <h5 className="text-[11px] font-black text-emerald-900 uppercase">Versement pour : {proj.titre}</h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Membre donateur *</label>
                            <select
                              value={selectedMembreId}
                              onChange={(e) => setSelectedMembreId(e.target.value)}
                              className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none"
                              required
                            >
                              <option value="">Sélectionner un membre...</option>
                              {membres.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.nom} ({m.matricule})
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Montant ({devise}) *</label>
                            <input
                              type="number"
                              placeholder="Ex: 5000"
                              value={montantVersement}
                              onChange={(e) => setMontantVersement(e.target.value)}
                              className="w-full p-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setSelectedProjetId(null)}
                            className="px-3 py-1.5 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-200/60"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                          >
                            {isSubmitting ? 'Validation...' : 'Valider le versement'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
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
