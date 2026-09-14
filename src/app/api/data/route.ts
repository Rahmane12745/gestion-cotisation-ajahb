import { NextResponse } from 'next/server';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS, INITIAL_USERS } from '@/lib/demoData';

export async function GET() {
  const db = getDatabase();
  return NextResponse.json(db);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'reset') {
      const resetDb = {
        membres: INITIAL_MEMBRES,
        paiements: INITIAL_PAIEMENTS,
        utilisateurs: INITIAL_USERS,
        updatedAt: new Date().toISOString(),
      };
      saveDatabase(resetDb);
      return NextResponse.json({ success: true, data: resetDb });
    }
    return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
