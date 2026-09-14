import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { INITIAL_MEMBRES, INITIAL_PAIEMENTS, INITIAL_USERS } from '@/lib/demoData';

export async function GET() {
  if (!isSupabaseConfigured() || !supabase) {
    // Fallback to local database
    const db = getDatabase();
    return NextResponse.json(db);
  }

  try {
    const [membresResult, paiementsResult, utilisateursResult] = await Promise.all([
      supabase.from('membres').select('*'),
      supabase.from('paiements').select('*').order('date_paiement', { ascending: false }),
      supabase.from('utilisateurs').select('*'),
    ]);

    if (membresResult.error || paiementsResult.error || utilisateursResult.error) {
      // Fallback to local database if Supabase fails
      const db = getDatabase();
      return NextResponse.json(db);
    }

    return NextResponse.json({
      membres: membresResult.data || [],
      paiements: paiementsResult.data || [],
      utilisateurs: utilisateursResult.data || [],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // Fallback to local database on error
    const db = getDatabase();
    return NextResponse.json(db);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === 'reset') {
      if (!isSupabaseConfigured() || !supabase) {
        // Fallback to local database
        const resetDb = {
          membres: INITIAL_MEMBRES,
          paiements: INITIAL_PAIEMENTS,
          utilisateurs: INITIAL_USERS,
          updatedAt: new Date().toISOString(),
        };
        saveDatabase(resetDb);
        return NextResponse.json({ success: true, data: resetDb });
      }

      // Delete all data from Supabase and reinitialize
      await Promise.all([
        supabase.from('paiements').delete().neq('id', ''),
        supabase.from('membres').delete().neq('id', ''),
        supabase.from('utilisateurs').delete().neq('id', ''),
      ]);

      // Insert initial data
      if (INITIAL_USERS.length > 0) {
        await supabase.from('utilisateurs').insert(
          INITIAL_USERS.map(({ id, ...rest }) => rest)
        );
      }

      if (INITIAL_MEMBRES.length > 0) {
        await supabase.from('membres').insert(
          INITIAL_MEMBRES.map(({ id, ...rest }) => rest)
        );
      }

      if (INITIAL_PAIEMENTS.length > 0) {
        await supabase.from('paiements').insert(
          INITIAL_PAIEMENTS.map(({ id, ...rest }) => rest)
        );
      }

      const resetDb = {
        membres: INITIAL_MEMBRES,
        paiements: INITIAL_PAIEMENTS,
        utilisateurs: INITIAL_USERS,
        updatedAt: new Date().toISOString(),
      };
      return NextResponse.json({ success: true, data: resetDb });
    }
    return NextResponse.json({ success: false, error: 'Action inconnue' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
