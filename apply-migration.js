// Script per applicare migration manualmente
// Uso: node apply-migration.js

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Errore: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devono essere definiti in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration(filePath) {
  try {
    console.log(`📄 Lettura migration: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log('⏳ Applicazione migration...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      console.error('❌ Errore durante applicazione migration:', error);
      process.exit(1);
    }

    console.log('✅ Migration applicata con successo!');
  } catch (err) {
    console.error('❌ Errore:', err.message);
    process.exit(1);
  }
}

// Applica migration
const migrationFile = process.argv[2] || './supabase/migrations/20251127_001_multi_tenancy_base.sql';
applyMigration(migrationFile);
