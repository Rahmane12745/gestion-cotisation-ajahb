import { Membre, Paiement, DashboardStats } from '@/types';

export const formatMoisFrancais = (moisStr: string): string => {
  // moisStr: '2026-09'
  if (!moisStr) return '';
  const [year, month] = moisStr.split('-');
  const moisNoms = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const index = parseInt(month, 10) - 1;
  return `${moisNoms[index] || month} ${year}`;
};

/**
 * Formatage propre des montants avec séparateur point (ex: 2.000 F)
 */
export const formatMontant = (montant: number, devise = 'F'): string => {
  if (isNaN(montant)) return `0 ${devise}`;
  const formattedNumber = Math.round(montant)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formattedNumber} ${devise}`;
};

export const formatTelephoneWhatsApp = (tel: string): string => {
  let cleaned = tel.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  return cleaned;
};

/**
 * Génère le texte officiel du reçu de versement pour WhatsApp
 */
export const genererTexteRecu = (
  membre: Membre,
  paiement: Paiement,
  devise = 'F',
  nomVillage = 'AJAHB'
): string => {
  const dateFormatted = new Date(paiement.date_paiement).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    `*===============================*\n` +
    `🏛️ *${nomVillage.toUpperCase()}*\n` +
    `*REÇU DE COTISATION MENSUELLE*\n` +
    `*===============================*\n\n` +
    `📄 *N° Reçu :* ${paiement.reference_recu || paiement.id.slice(0, 8).toUpperCase()}\n` +
    `👤 *Membre :* ${membre.nom}\n` +
    `🆔 *Matricule :* ${membre.matricule}\n` +
    `📞 *Téléphone :* ${membre.telephone}\n` +
    (membre.quartier ? `📍 *Quartier :* ${membre.quartier}\n` : '') +
    `\n` +
    `🗓️ *Mois cotisé :* ${formatMoisFrancais(paiement.mois)}\n` +
    `💰 *Montant versé :* ${formatMontant(paiement.montant, devise)}\n` +
    `💳 *Mode de versement :* ${paiement.mode_paiement || 'Espèces'}\n` +
    `⏰ *Date & Heure :* ${dateFormatted}\n` +
    `✍️ *Encaissé par :* ${paiement.encaisseur}\n` +
    `\n` +
    `✅ *Statut :* Paiement validé et enregistré dans le registre central.\n\n` +
    `_Merci pour votre contribution active au village ${nomVillage} !_`
  );
};

/**
 * Génère le texte officiel du reçu de versement pour un Projet Spécial
 */
export const genererTexteRecuProjet = (
  membre: Membre,
  projetTitre: string,
  montant: number,
  modePaiement = 'Espèces',
  encaisseur = 'Trésorier',
  devise = 'F',
  nomVillage = 'AJAHB'
): string => {
  const dateFormatted = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    `*===============================*\n` +
    `🏛️ *${nomVillage.toUpperCase()}*\n` +
    `*REÇU DE CONTRIBUTION PROJET*\n` +
    `*===============================*\n\n` +
    `🎯 *Projet :* ${projetTitre}\n` +
    `👤 *Donateur :* ${membre.nom}\n` +
    `🆔 *Matricule :* ${membre.matricule}\n` +
    `📞 *Téléphone :* ${membre.telephone}\n\n` +
    `💰 *Montant versé :* ${formatMontant(montant, devise)}\n` +
    `💳 *Mode de paiement :* ${modePaiement}\n` +
    `⏰ *Date & Heure :* ${dateFormatted}\n` +
    `✍️ *Encaissé par :* ${encaisseur}\n\n` +
    `✅ *Statut :* Contribution validée. Merci pour votre soutien au projet !`
  );
};

/**
 * Génère un message de rappel bienveillant pour un membre en retard
 */
export const genererTexteRappel = (
  membre: Membre,
  mois: string,
  montant: number,
  devise = 'F',
  nomVillage = 'AJAHB'
): string => {
  return (
    `Salam / Bonjour *${membre.nom}*,\n\n` +
    `Sauf erreur de notre part, votre cotisation mensuelle pour *${formatMoisFrancais(mois)}* d'un montant de *${formatMontant(montant, devise)}* est en attente de règlement au niveau du bureau de l'*${nomVillage}*.\n\n` +
    `🆔 Votre matricule : ${membre.matricule}\n\n` +
    `Merci de bien vouloir vous rapprocher du trésorier pour votre régularisation. Merci pour votre engagement !`
  );
};

/**
 * Génère le point mensuel global à diffuser dans le groupe WhatsApp du village
 */
export const genererPointCommunaute = (
  stats: DashboardStats,
  mois: string,
  nomVillage = 'AJAHB',
  devise = 'F'
): string => {
  return (
    `📢 *COMMUNIQUÉ DU BUREAU - ${nomVillage.toUpperCase()}*\n` +
    `📊 *Point des cotisations : ${formatMoisFrancais(mois)}*\n` +
    `----------------------------------------\n\n` +
    `💰 *Total Collecté :* ${formatMontant(stats.totalCollecteMois, devise)}\n` +
    `🎯 *Objectif du mois :* ${formatMontant(stats.objectifMois, devise)}\n` +
    `📈 *Taux de recouvrement :* ${stats.tauxRecouvrement}%\n\n` +
    `👥 *Membres à jour :* ${stats.membresPayesMois} membres ✅\n` +
    `⏳ *Membres en attente :* ${stats.membresEnRetardMois} membres\n\n` +
    `🙏 Merci aux membres ayant déjà cotisé pour le développement de notre village ${nomVillage}.\n\n` +
    `_Pour toute régularisation, contactez le trésorier._`
  );
};

/**
 * Ouvre la boîte de dialogue de partage natif (Web Share API) ou redirige vers WhatsApp
 */
export const partagerSurWhatsApp = async (
  texte: string,
  telephone?: string,
  titre = 'Partage Cotisation AJAHB'
): Promise<boolean> => {
  if (navigator.share && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
    try {
      await navigator.share({
        title: titre,
        text: texte,
      });
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.warn('Erreur navigator.share', error);
      } else {
        return false;
      }
    }
  }

  const encodedText = encodeURIComponent(texte);
  const cleanPhone = telephone ? formatTelephoneWhatsApp(telephone) : '';
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
