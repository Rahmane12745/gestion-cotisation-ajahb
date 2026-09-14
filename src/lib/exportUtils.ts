import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Membre, MembreWithStats, Paiement, Depense } from '@/types';
import { formatMoisFrancais, formatMontant } from './whatsappUtils';

/**
 * 1. RAPPORT OFFICIEL DU BILAN MENSUEL (PDF) - AJAHB
 */
export const exporterBilanMensuelPDF = (
  membres: MembreWithStats[],
  moisActuel: string,
  totalCollecte: number,
  nomVillage = 'AJAHB'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const payesCount = membres.filter((m) => m.statutMoisCourant).length;
  const nonPayesCount = membres.length - payesCount;
  const taux = membres.length > 0 ? Math.round((payesCount / membres.length) * 100) : 0;
  const nomMoisLong = formatMoisFrancais(moisActuel);
  const nomMoisCourt = nomMoisLong.split(' ')[0];

  // --- EN-TÊTE OFFICIEL ---
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 6, 'F'); // Bande verte supérieure

  // Titre du Village
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105);
  doc.text(nomVillage.toUpperCase(), 14, 19);

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Association & Registre Numérique des Cotisations', 14, 25);

  // Titre du document
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`BILAN MENSUEL DES COTISATIONS - ${nomMoisLong.toUpperCase()}`, 14, 35);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Document officiel généré le ${dateGeneration}`, 14, 40);

  // --- CADRE RÉSUMÉ STATISTIQUE (KPIs) ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, 182, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(`Membres Inscrits : ${membres.length}`, 20, 52);

  doc.setTextColor(5, 150, 105);
  doc.text(`Cotisations Payées : ${payesCount} (${taux}%)`, 20, 60);

  doc.setTextColor(225, 29, 72);
  doc.text(`En Attente : ${nonPayesCount}`, 105, 52);

  doc.setTextColor(5, 150, 105);
  doc.setFontSize(10.5);
  doc.text(`Total Collecté : ${formatMontant(totalCollecte, 'F')}`, 105, 60);

  // --- TABLEAU DES MEMBRES PARFAITEMENT ALIGNÉ ---
  const tableData = membres.map((m, index) => [
    index + 1,
    m.matricule,
    m.surnom ? `${m.nom} (${m.surnom})` : m.nom,
    m.telephone,
    m.quartier || '-',
    m.statutMoisCourant ? 'PAYÉ' : 'EN RETARD',
    formatMontant(m.montantPayeAnnee, 'F'),
  ]);

  autoTable(doc, {
    startY: 70,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['N°', 'Matricule', 'Nom & Prénom', 'Téléphone', 'Quartier', `Statut (${nomMoisCourt})`, 'Total Versé']],
    body: tableData,
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 38 },
      3: { cellWidth: 30 },
      4: { cellWidth: 38 },
      5: { cellWidth: 24, halign: 'center' },
      6: { cellWidth: 24, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 5) {
        if (data.cell.raw === 'PAYÉ') {
          data.cell.styles.textColor = [5, 150, 105];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 6) {
        data.cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `AJAHB • Registre Officiel des Cotisations • Page ${data.pageNumber} sur ${pageCount}`,
        14,
        290
      );
    },
  });

  // Bloc de signatures officiel
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 265) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Le Trésorier Général', 25, finalY);
    doc.text('Le Président de l\'AJAHB', 135, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Signature & Cachet)', 25, finalY + 4);
    doc.text('(Signature & Cachet)', 135, finalY + 4);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`AJAHB_Bilan_${moisActuel}_${dateStr}.pdf`);
};

/**
 * 2. JOURNAL DES PAIEMENTS & REÇUS (PDF) - AJAHB
 */
export const exporterJournalPaiementsPDF = (
  paiements: Paiement[],
  membresMap: Map<string, Membre>,
  nomVillage = 'AJAHB'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalMontant = paiements.reduce((sum, p) => sum + Number(p.montant), 0);

  // En-tête
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105);
  doc.text(nomVillage.toUpperCase(), 14, 19);

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Journal Comptable des Écritures & Reçus', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('HISTORIQUE GÉNÉRAL DES VERSEMENTS', 14, 35);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total cumulé : ${formatMontant(totalMontant, 'F')} (${paiements.length} reçus émis) • Généré le ${dateGeneration}`, 14, 40);

  const tableData = paiements.map((p, index) => {
    const membre = membresMap.get(p.membre_id);
    return [
      index + 1,
      p.reference_recu || p.id.slice(0, 8).toUpperCase(),
      membre?.nom || 'Inconnu',
      membre?.matricule || '-',
      formatMoisFrancais(p.mois).split(' ')[0],
      formatMontant(p.montant, 'F'),
      p.mode_paiement || 'Espèces',
      new Date(p.date_paiement).toLocaleDateString('fr-FR'),
      p.encaisseur,
    ];
  });

  autoTable(doc, {
    startY: 46,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['N°', 'N° Reçu', 'Membre', 'Matricule', 'Mois', 'Montant', 'Mode', 'Date', 'Encaissé par']],
    body: tableData,
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 20 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20, halign: 'right' },
      6: { cellWidth: 18 },
      7: { cellWidth: 18 },
      8: { cellWidth: 20 },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AJAHB • Journal des Paiements • Page ${data.pageNumber} sur ${pageCount}`, 14, 290);
    },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`AJAHB_Journal_Paiements_${dateStr}.pdf`);
};

/**
 * 3. REGISTRE COMPLET DES MEMBRES (PDF) - AJAHB
 */
export const exporterRegistreMembresPDF = (
  membres: MembreWithStats[],
  nomVillage = 'AJAHB'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // En-tête
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105);
  doc.text(nomVillage.toUpperCase(), 14, 19);

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Annuaire & Répertoire Officiel des Membres', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`REGISTRE COMPLET DES ${membres.length} MEMBRES`, 14, 35);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateGeneration} | Identification unique et traçabilité`, 14, 40);

  const tableData = membres.map((m, index) => [
    index + 1,
    m.matricule,
    m.surnom ? `${m.nom} (${m.surnom})` : m.nom,
    m.telephone,
    m.quartier || 'Non spécifié',
    `${m.moisPayesCount} mois`,
    formatMontant(m.montantPayeAnnee, 'F'),
  ]);

  autoTable(doc, {
    startY: 46,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['N°', 'Matricule', 'Nom & Prénom', 'Téléphone', 'Quartier', 'Mois Réglés', 'Total Versé']],
    body: tableData,
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [5, 150, 105],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 42 },
      3: { cellWidth: 32 },
      4: { cellWidth: 38 },
      5: { cellWidth: 20, halign: 'center' },
      6: { cellWidth: 20, halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AJAHB • Registre des Membres • Page ${data.pageNumber} sur ${pageCount}`, 14, 290);
    },
  });

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`AJAHB_Registre_Membres_${dateStr}.pdf`);
};

/**
 * 4. RAPPORT FINANCIER & BILAN BUDGÉTAIRE (PDF) - AJAHB
 * Calcule : Recettes Cotisations - Dépenses Déboursées = Solde Net en Caisse
 */
export const exporterRapportFinancierBudgetPDF = (
  paiements: Paiement[],
  depenses: Depense[],
  moisActuel: string,
  nomVillage = 'AJAHB'
) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const dateGeneration = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const totalRecettes = paiements.reduce((sum, p) => sum + Number(p.montant), 0);
  const totalDepenses = depenses.reduce((sum, d) => sum + Number(d.montant), 0);
  const soldeNet = totalRecettes - totalDepenses;

  // En-tête
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 0, 210, 6, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(5, 150, 105);
  doc.text(nomVillage.toUpperCase(), 14, 19);

  doc.setFontSize(9.5);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text('Trésorerie & Bilan Financier Général', 14, 25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`RAPPORT FINANCIER & ÉTAT DU FOND DE CAISSE`, 14, 35);

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`Généré le ${dateGeneration} | Association AJAHB`, 14, 40);

  // --- CADRE RÉSUMÉ COMPTABLE ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 44, 182, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(5, 150, 105);
  doc.text(`TOTAL RECETTES (COTISATIONS) : ${formatMontant(totalRecettes, 'F')}`, 20, 52);

  doc.setTextColor(225, 29, 72);
  doc.text(`TOTAL DÉPENSES DÉBOURSÉES : ${formatMontant(totalDepenses, 'F')}`, 20, 62);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`SOLDE NET EN CAISSE : ${formatMontant(soldeNet, 'F')}`, 105, 57);

  // --- TABLEAU DES DÉPENSES ---
  const tableData = depenses.map((d, index) => [
    index + 1,
    d.motif,
    d.categorie || 'Général',
    formatMontant(d.montant, 'F'),
    new Date(d.date_depense).toLocaleDateString('fr-FR'),
    d.enregistre_par || 'Trésorier',
    d.remarque || '-',
  ]);

  autoTable(doc, {
    startY: 75,
    margin: { left: 14, right: 14 },
    tableWidth: 182,
    head: [['N°', 'Motif / Libellé', 'Catégorie', 'Montant', 'Date', 'Enregistré par', 'Remarque']],
    body: tableData,
    theme: 'grid',
    styles: {
      overflow: 'linebreak',
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [225, 29, 72],
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 45 },
      2: { cellWidth: 30 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 20 },
      5: { cellWidth: 24 },
      6: { cellWidth: 30 },
    },
    alternateRowStyles: {
      fillColor: [254, 242, 242],
    },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`AJAHB • Bilan Financier & Caisse • Page ${data.pageNumber} sur ${pageCount}`, 14, 290);
    },
  });

  // Bloc de signatures officiel
  const finalY = (doc as any).lastAutoTable.finalY + 12;
  if (finalY < 265) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Le Trésorier Général', 25, finalY);
    doc.text('Le Président de l\'AJAHB', 135, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('(Signature & Cachet)', 25, finalY + 4);
    doc.text('(Signature & Cachet)', 135, finalY + 4);
  }

  const dateStr = new Date().toISOString().split('T')[0];
  doc.save(`AJAHB_Bilan_Financier_${dateStr}.pdf`);
};

