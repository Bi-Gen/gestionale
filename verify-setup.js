// Script per verificare setup database multi-tenancy
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

async function verifySetup() {
  console.log('🔍 VERIFICA SETUP DATABASE MULTI-TENANCY\n');
  console.log('='.repeat(70));

  let allGood = true;

  try {
    // Verifica tabelle principali
    console.log('\n📋 Verifica Tabelle Principali');
    console.log('-'.repeat(70));

    const tables = [
      { name: 'piano_abbonamento', pk: 'codice' },
      { name: 'azienda', pk: 'id' },
      { name: 'utente_azienda', pk: 'id' },
      { name: 'superadmin_users', pk: 'user_id' },
      { name: 'soggetto', pk: 'id' },
      { name: 'prodotto', pk: 'id' },
      { name: 'magazzino', pk: 'id' },
      { name: 'aliquota_iva', pk: 'id' },
      { name: 'causale_movimento', pk: 'id' },
      { name: 'movimento_magazzino', pk: 'id' }
    ];

    for (const table of tables) {
      const { error } = await supabase.from(table.name).select(table.pk).limit(0);
      if (error) {
        console.log(`   ❌ Tabella ${table.name}: NON TROVATA`);
        console.log(`      Error: ${error.message}`);
        allGood = false;
      } else {
        console.log(`   ✅ Tabella ${table.name}: OK`);
      }
    }

    // Verifica piani abbonamento
    console.log('\n📋 Verifica Piani Abbonamento');
    console.log('-'.repeat(70));

    const { data: piani, error: pianiError } = await supabase
      .from('piano_abbonamento')
      .select('codice, nome')
      .order('codice');

    if (pianiError) {
      console.log('   ❌ Errore nel recupero piani:', pianiError.message);
      allGood = false;
    } else if (!piani || piani.length === 0) {
      console.log('   ❌ Nessun piano abbonamento trovato');
      allGood = false;
    } else {
      console.log(`   ✅ Trovati ${piani.length} piani abbonamento:`);
      piani.forEach(p => console.log(`      - ${p.codice}: ${p.nome}`));
    }

    // Verifica helper functions
    console.log('\n📋 Verifica Helper Functions');
    console.log('-'.repeat(70));

    // Test function con parametri
    const functionsToTest = [
      { name: 'get_user_azienda_id', params: {} },
      { name: 'user_has_permission', params: { p_resource: 'prodotti', p_action: 'read' } },
      { name: 'feature_enabled', params: { p_feature: 'magazzini_multipli' } },
      { name: 'is_superadmin', params: {} }
    ];

    for (const func of functionsToTest) {
      try {
        const { error } = await supabase.rpc(func.name, func.params);
        // Se non c'è errore OR l'errore è solo per mancanza di contesto auth, la function esiste
        if (!error || error.message.includes('could not identify') || error.message.includes('auth.uid') || error.message.includes('JWT')) {
          console.log(`   ✅ Function ${func.name}: OK`);
        } else {
          console.log(`   ❌ Function ${func.name}: ${error.message}`);
          allGood = false;
        }
      } catch (err) {
        console.log(`   ⚠️  Function ${func.name}: ${err.message}`);
      }
    }

    // Verifica trigger auto-seed
    console.log('\n📋 Verifica Trigger Auto-Seed');
    console.log('-'.repeat(70));

    console.log('   ℹ️  Trigger auto-seed verificabili solo creando un\'azienda');
    console.log('   ℹ️  Saranno testati durante il signup');

    // Riepilogo
    console.log('\n' + '='.repeat(70));
    if (allGood) {
      console.log('✅ SETUP DATABASE OK!');
      console.log('\n🎯 Prossimo step: testare signup da browser');
      console.log('   1. npm run dev');
      console.log('   2. Vai su http://localhost:3000/signup');
      console.log('   3. Registrati con i dati azienda');
      console.log('   4. Verifica creazione azienda + auto-seed');
    } else {
      console.log('❌ ALCUNI CONTROLLI FALLITI');
      console.log('\n🔧 Potrebbe essere necessario applicare le migration:');
      console.log('   - Verifica che tutte le migration siano state eseguite');
      console.log('   - Controlla i log di Supabase per errori');
    }
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.log('\n❌ ERRORE:', error.message);
    console.log(error);
  }
}

verifySetup();
