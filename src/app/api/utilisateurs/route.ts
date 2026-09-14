import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const db = getDatabase();

    const exists = db.utilisateurs.find(
      (u) => u.email.toLowerCase() === (data.email || '').trim().toLowerCase()
    );
    if (exists) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cette adresse email existe déjà.' },
        { status: 400 }
      );
    }

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      nom: (data.nom || '').trim(),
      email: (data.email || '').trim().toLowerCase(),
      role: data.role || 'membre_bureau',
      actif: true,
      date_creation: new Date().toISOString(),
    };

    db.utilisateurs.push(newUser);
    saveDatabase(db);

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    const db = getDatabase();

    const index = db.utilisateurs.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ success: false, error: 'Compte introuvable' }, { status: 404 });
    }

    db.utilisateurs[index] = { ...db.utilisateurs[index], ...updates };
    saveDatabase(db);

    return NextResponse.json({ success: true, user: db.utilisateurs[index] });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
