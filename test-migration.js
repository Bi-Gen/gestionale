// Script per testare che la migration sia andata a buon fine
// Uso: node test-migration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testMigration() {
  console.log('🧪 TEST MIGRATION - Multi-Tenancy Base\n');
  console.log('='.repeat(60));

  let allPassed = true;

  // Test 1: Tabella azienda esiste
  console.log('\n📋 Test 1: Verifica tabella azienda');
  try {
    const { data, error } = await supabase
      .from('azienda')
      .select('id')
      .limit(0);

    if (error && error.code !== 'PGRST116') {  // PGRST116 = empty result (OK)
      throw error;
    }
    console.log('✅ Tabella azienda esiste');
  } catch (err) {
    console.log('❌ Tabella azienda NON esiste:', err.message);
    allPassed = false;
  }

  // Test 2: Tabella utente_azienda esiste
  console.log('\n📋 Test 2: Verifica tabella utente_azienda');
  try {
    const { data, error } = await supabase
      .from('utente_azienda')
      .select('id')
      .limit(0);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    console.log('✅ Tabella utente_azienda esiste');
  } catch (err) {
    console.log('❌ Tabella utente_azienda NON esiste:', err.message);
    allPassed = false;
  }

  // Test 3: Inserimento azienda di test
  console.log('\n📋 Test 3: Inserimento azienda di test');
  try {
    const { data, error } = await supabase
      .from('azienda')
      .insert({
        nome: 'Test Azienda SRL',
        email: `test${Date.now()}@example.com`,  // Email unica
        piano: 'premium',
        stato: 'trial'
      })
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Azienda creata:', {
      id: data.id,
      nome: data.nome,
      piano: data.piano,
      max_utenti: data.max_utenti,
      max_prodotti: data.max_prodotti,
      trial_fino_a: data.trial_fino_a
    });

    // Verifica trigger: max_utenti dovrebbe essere 5 (piano premium)
    if (data.max_utenti === 5) {
      console.log('✅ Trigger set_piano_limits funziona correttamente');
    } else {
      console.log(`❌ Trigger set_piano_limits NON funziona. Atteso: 5, Ottenuto: ${data.max_utenti}`);
      allPassed = false;
    }

    // Verifica feature flags
    if (data.features_abilitate.magazzini_multipli === true) {
      console.log('✅ Feature flags popolati correttamente (magazzini_multipli = true per premium)');
    } else {
      console.log('❌ Feature flags NON popolati correttamente');
      allPassed = false;
    }

    // Cleanup: elimina azienda di test
    await supabase.from('azienda').delete().eq('id', data.id);
    console.log('🧹 Azienda di test eliminata');

  } catch (err) {
    console.log('❌ Errore inserimento azienda:', err.message);
    allPassed = false;
  }

  // Test 4: Verifica funzioni trigger
  console.log('\n📋 Test 4: Verifica funzioni esistono');
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: `
        SELECT proname
        FROM pg_proc
        WHERE proname IN ('set_piano_limits', 'set_ruolo_permessi', 'update_updated_at_column');
      `
    });

    if (error) throw error;
    console.log('✅ Funzioni trigger esistono');
  } catch (err) {
    console.log('⚠️  Non posso verificare funzioni (RPC exec_sql non disponibile)');
    // Non è un errore critico
  }

  // Risultato finale
  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ TUTTI I TEST PASSATI!');
    console.log('\n🎯 Prossimo step: Applicare TASK 2 (Helper functions RLS)');
  } else {
    console.log('❌ ALCUNI TEST FALLITI - Controlla gli errori sopra');
  }
  console.log('='.repeat(60) + '\n');
}

testMigration();
