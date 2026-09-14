import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { UserProfile } from '@/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to local database
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
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', (data.email || '').trim().toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Un compte avec cette adresse email existe déjà.' },
        { status: 400 }
      );
    }

    const { data: newUser, error } = await supabase
      .from('utilisateurs')
      .insert([
        {
          nom: (data.nom || '').trim(),
          email: (data.email || '').trim().toLowerCase(),
          role: data.role || 'membre_bureau',
          actif: true,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Erreur lors de la création du compte' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la création du compte' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to local database
      const db = getDatabase();
      const index = db.utilisateurs.findIndex((u) => u.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Compte introuvable' }, { status: 404 });
      }

      db.utilisateurs[index] = { ...db.utilisateurs[index], ...updates };
      saveDatabase(db);
      return NextResponse.json({ success: true, user: db.utilisateurs[index] });
    }

    const { data: updatedUser, error } = await supabase
      .from('utilisateurs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Compte introuvable' },
        { status: error.code === 'PGRST116' ? 404 : 400 }
      );
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}
