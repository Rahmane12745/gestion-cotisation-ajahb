import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { Paiement } from '@/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getDatabase();

    // Vérification si déjà payé pour ce mois
    const dejaPaye = db.paiements.find(
      (p) => p.membre_id === data.membre_id && p.mois === data.mois
    );
    if (dejaPaye) {
      return NextResponse.json(
        {
          success: false,
          error: `Un versement existe déjà pour le mois de ${data.mois} (Reçu N° ${dejaPaye.reference_recu || dejaPaye.id.slice(0, 8)})`,
        },
        { status: 400 }
      );
    }

    const refNum = Math.floor(1000 + Math.random() * 9000);
    const reference_recu = `REC-${(data.mois || '').replace('-', '')}-${refNum}`;

    const newPaiement: Paiement = {
      id: `pay-${Date.now()}`,
      membre_id: data.membre_id,
      mois: data.mois,
      montant: Number(data.montant),
      date_paiement: new Date().toISOString(),
      encaisseur: data.encaisseur || 'Trésorier',
      mode_paiement: data.mode_paiement || 'Espèces',
      reference_recu,
      remarque: data.remarque,
      date_creation: new Date().toISOString(),
    };

    db.paiements.unshift(newPaiement);
    saveDatabase(db);

    return NextResponse.json({ success: true, paiement: newPaiement });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de l\'enregistrement du versement' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID manquant' }, { status: 400 });
    }

    const db = getDatabase();
    db.paiements = db.paiements.filter((p) => p.id !== id);
    saveDatabase(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
