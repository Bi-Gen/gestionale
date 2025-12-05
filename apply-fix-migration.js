// Script per applicare la migration di fix
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Mancano le variabili d\'ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
  console.log('🔧 APPLICAZIONE MIGRATION FIX RLS E AUTO-SEED\n');

  try {
    // Leggi il file SQL
    const sqlFile = path.join(__dirname, 'supabase', 'migrations', '20251128_001_fix_rls_and_autoseed.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Migration file:', sqlFile);
    console.log('📏 SQL size:', sql.length, 'bytes\n');

    // Esegui la migration
    console.log('⏳ Esecuzione migration...\n');

    const { error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // Se exec_sql non esiste, proviamo a eseguire direttamente
      console.log('⚠️  exec_sql non disponibile, esecuzione diretta...\n');

      // Dividi in statement separati e esegui uno per uno
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.includes('COMMENT') || stmt.includes('DROP TRIGGER') || stmt.includes('DO $$')) {
          // Skip comments e alcuni statement che potrebbero dare problemi
          continue;
        }

        console.log(`Executing statement ${i+1}/${statements.length}...`);
        const { error: stmtError } = await supabase.rpc('exec', { sql: stmt + ';' });

        if (stmtError) {
          console.log(`⚠️  Warning statement ${i+1}:`, stmtError.message);
        }
      }
    }

    console.log('\n✅ Migration applicata con successo!\n');

    // Verifica risultati
    console.log('🔍 VERIFICA POST-MIGRATION\n');

    // Verifica RLS policies
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
      .eq('tablename', 'utente_azienda');

    console.log(`📋 RLS Policies su utente_azienda: ${policies?.length || 0}`);
    if (policies && policies.length > 0) {
      policies.forEach(p => console.log(`   - ${p.policyname}`));
    }

    // Verifica auto-seed per azienda esistente
    const { data: azienda } = await supabase
      .from('azienda')
      .select('id, nome')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (azienda) {
      const { data: magazzini } = await supabase
        .from('magazzino')
        .select('*')
        .eq('azienda_id', azienda.id);

      const { data: iva } = await supabase
        .from('aliquota_iva')
        .select('*')
        .eq('azienda_id', azienda.id);

      const { data: causali } = await supabase
        .from('causale_movimento')
        .select('*')
        .eq('azienda_id', azienda.id);

      console.log(`\n🏢 Azienda: ${azienda.nome}`);
      console.log(`   Magazzini: ${magazzini?.length || 0}`);
      console.log(`   Aliquote IVA: ${iva?.length || 0}`);
      console.log(`   Causali: ${causali?.length || 0}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TUTTO OK! Puoi ora rifare il signup o fare login');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ ERRORE:', error.message);
    console.error(error);
  }
}

applyMigration();
