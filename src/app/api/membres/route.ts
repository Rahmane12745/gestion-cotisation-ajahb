import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getDatabase, saveDatabase } from '@/lib/serverDb';
import { Membre } from '@/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to local database
      const db = getDatabase();
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
    }

    // Check if phone already exists
    const cleanPhone = (data.telephone || '').replace(/[\s-]/g, '');
    const { data: existingMembre } = await supabase
      .from('membres')
      .select('*')
      .or(`telephone.ilike.%${data.telephone}%`)
      .limit(1)
      .single();

    if (existingMembre) {
      return NextResponse.json(
        { success: false, error: `Un membre avec ce numéro existe déjà (${existingMembre.nom} - ${existingMembre.matricule})` },
        { status: 400 }
      );
    }

    // Calculer le prochain matricule disponible
    const { data: allMembres } = await supabase.from('membres').select('matricule');
    const maxNum = (allMembres || []).reduce((max, m) => {
      const num = parseInt((m.matricule || '').replace(/[^0-9]/g, ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 0);
    const calculatedMatricule = `MBR-${String(maxNum + 1).padStart(4, '0')}`;

    const { data: newMembre, error } = await supabase
      .from('membres')
      .insert([
        {
          matricule: calculatedMatricule,
          nom: (data.nom || '').trim(),
          surnom: (data.surnom || '').trim() || null,
          telephone: (data.telephone || '').trim(),
          quartier: (data.quartier || 'Non spécifié').trim(),
          photo: data.photo || null,
          actif: true,
        },
      ])
      .select()
      .single();

    if (error) {
      // En cas de conflit de clé unique (membres_matricule_key), réessayer avec un identifiant basé sur le timestamp
      const fallbackMatricule = `MBR-${Date.now().toString().slice(-6)}`;
      const { data: retryMembre, error: retryError } = await supabase
        .from('membres')
        .insert([
          {
            matricule: fallbackMatricule,
            nom: (data.nom || '').trim(),
            surnom: (data.surnom || '').trim() || null,
            telephone: (data.telephone || '').trim(),
            quartier: (data.quartier || 'Non spécifié').trim(),
            photo: data.photo || null,
            actif: true,
          },
        ])
        .select()
        .single();

      if (retryError) {
        return NextResponse.json(
          { success: false, error: retryError.message || 'Erreur lors de la création du membre' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, membre: retryMembre });
    }

    return NextResponse.json({ success: true, membre: newMembre });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la création du membre' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to local database
      const db = getDatabase();
      const index = db.membres.findIndex((m) => m.id === id);
      if (index === -1) {
        return NextResponse.json({ success: false, error: 'Membre introuvable' }, { status: 404 });
      }

      db.membres[index] = { ...db.membres[index], ...updates };
      saveDatabase(db);
      return NextResponse.json({ success: true, membre: db.membres[index] });
    }

    const { data: updatedMembre, error } = await supabase
      .from('membres')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Membre introuvable' },
        { status: error.code === 'PGRST116' ? 404 : 400 }
      );
    }

    return NextResponse.json({ success: true, membre: updatedMembre });
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

    if (!isSupabaseConfigured() || !supabase) {
      // Fallback to local database
      const db = getDatabase();
      db.membres = db.membres.filter((m) => m.id !== id);
      db.paiements = db.paiements.filter((p) => p.membre_id !== id);
      saveDatabase(db);
      return NextResponse.json({ success: true });
    }

    // Delete member and related payments
    const { error: paymentError } = await supabase
      .from('paiements')
      .delete()
      .eq('membre_id', id);

    if (paymentError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression des paiements' },
        { status: 400 }
      );
    }

    const { error: memberError } = await supabase
      .from('membres')
      .delete()
      .eq('id', id);

    if (memberError) {
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la suppression du membre' },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}
