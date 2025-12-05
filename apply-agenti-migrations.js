// Script per applicare le migrations agenti
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: variabili ambiente mancanti');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement.trim().length === 0) continue;

    console.log(`\n⏳ Esecuzione: ${statement.substring(0, 80)}...`);

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: statement + ';'
    }).catch(async (err) => {
      // Fallback: try direct query for simple statements
      return await supabase.from('_').select('*').limit(0).then(() => {
        console.log('⚠️ exec_sql non disponibile, prova manualmente');
        return { error: 'exec_sql non disponibile' };
      });
    });

    if (error) {
      // Not a critical error if it's just about the RPC function
      if (error.message && error.message.includes('exec_sql')) {
        console.log('ℹ️ Funzione RPC non disponibile. Applica le migration manualmente via Supabase SQL Editor:');
        console.log('\n📁 File da applicare in ordine:');
        console.log('   1. supabase/migrations/20251129_add_agenti.sql');
        console.log('   2. supabase/migrations/20251129_fix_agenti_constraint.sql');
        console.log('\n📝 Copia il contenuto dei file nella SQL Editor di Supabase');
        process.exit(0);
      }
      console.error('❌ Errore:', error);
      throw error;
    }

    console.log('✅ OK');
  }
}

async function applyMigrations() {
  console.log('🚀 Applicazione migrations agenti\n');

  const migrations = [
    './supabase/migrations/20251129_add_agenti.sql',
    './supabase/migrations/20251129_fix_agenti_constraint.sql'
  ];

  for (const file of migrations) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📄 Migration: ${file}`);
      console.log('='.repeat(60));

      const sql = fs.readFileSync(file, 'utf-8');
      await executeSql(sql);

      console.log(`\n✅ Migration ${file} completata!`);
    } catch (err) {
      console.error(`\n❌ Errore in ${file}:`, err.message);

      console.log('\n💡 Suggerimento: Applica manualmente le migrations:');
      console.log('   1. Apri Supabase Dashboard > SQL Editor');
      console.log(`   2. Copia il contenuto di ${file}`);
      console.log('   3. Esegui la query');

      process.exit(1);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Tutte le migrations applicate con successo!');
  console.log('='.repeat(60));
}

applyMigrations();
