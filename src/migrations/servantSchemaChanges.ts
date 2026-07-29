import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';

/**
 * Migration script to implement the servant management schema changes.
 * Creates servant records for shepherds/interns who don't have one yet.
 */
export async function migrateToServantSchema() {
  try {
    let shepherdsMigrated = 0;
    let shepherdsSkipped = 0;

    const { data: shepherds, error: sErr } = await supabase
      .from('users')
      .select('id, full_name, nickname, gender, phone, email, role, business_profiles')
      .in('role', ['shepherd', 'intern'])
      .eq('status', 'active');

    if (sErr) throw sErr;

    for (const shepherd of shepherds || []) {
      const { data: existing } = await supabase
        .from('servants')
        .select('id')
        .eq('phone', shepherd.phone)
        .limit(1);

      const now = new Date().toISOString();

      if (existing && existing.length > 0) {
        await supabase.from('servants').update({
          is_shepherd: true,
          shepherd_id: shepherd.id,
          updated_at: now,
        }).eq('id', existing[0].id);
        shepherdsSkipped++;
      } else {
        await supabase.from('servants').insert({
          full_name: shepherd.full_name,
          nickname: shepherd.nickname || null,
          gender: shepherd.gender || 'male',
          phone: shepherd.phone,
          email: shepherd.email,
          is_shepherd: true,
          shepherd_id: shepherd.id,
          department_id: null,
          is_head: false,
          status: 'active',
          created_at: now,
          updated_at: now,
        });
        shepherdsMigrated++;
      }
    }

    return { success: true, stats: { shepherdsMigrated, shepherdsSkipped } };
  } catch (error) {
    console.error('Error migrating to servant schema:', error);
    toast.error('Erreur lors de la migration du schéma des B.O.S.S');
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function runServantSchemaMigration() {
  toast.loading('Migration en cours...');
  try {
    const result = await migrateToServantSchema();
    if (result.success) {
      toast.success(`Migration réussie: ${result.stats?.shepherdsMigrated || 0} berger(s) migré(s), ${result.stats?.shepherdsSkipped || 0} déjà existant(s)`);
    } else {
      toast.error(`Échec de la migration: ${result.error}`);
    }
  } catch (error) {
    console.error('Error running migration:', error);
    toast.error("Erreur lors de l'exécution de la migration");
  }
}
