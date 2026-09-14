import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { Membre } from '@/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getDatabase();

    // Vérification téléphone unique
    const cleanPhone = (data.telephone || '').replace(/[\s-]/g, '');
    const exists = db.membres.find((m) => m.telephone.replace(/[\s-]/g, '') === cleanPhone);
    if (exists) {
      return NextResponse.json(
        { success: false, error: `Un membre avec ce numéro existe déjà (${exists.nom} - ${exists.matricule})` },
        { status: 400 }
      );
    }

    const nextNumber = db.membres.length + 1;
    const matricule = `MBR-${String(nextNumber).padStart(4, '0')}`;

    const newMembre: Membre = {
      id: `mbr-${Date.now()}`,
      matricule,
      nom: (data.nom || '').trim(),
      telephone: (data.telephone || '').trim(),
      quartier: (data.quartier || 'Non spécifié').trim(),
      photo: data.photo,
      actif: true,
      date_creation: new Date().toISOString(),
    };

    db.membres.push(newMembre);
    saveDatabase(db);

    return NextResponse.json({ success: true, membre: newMembre });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la création du membre' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const db = getDatabase();

    const index = db.membres.findIndex((m) => m.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Membre introuvable' }, { status: 404 });
    }

    db.membres[index] = { ...db.membres[index], ...updates };
    saveDatabase(db);

    return NextResponse.json({ success: true, membre: db.membres[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
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
    db.membres = db.membres.filter((m) => m.id !== id);
    db.paiements = db.paiements.filter((p) => p.membre_id !== id);
    saveDatabase(db);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
