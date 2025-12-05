// Script per verificare cosa è successo durante il signup
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkSignup() {
  console.log('🔍 VERIFICA SIGNUP\n');

  // Trova l'azienda più recente
  const { data: azienda } = await supabase
    .from('azienda')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!azienda) {
    console.log('❌ Nessuna azienda trovata');
    return;
  }

  console.log('✅ AZIENDA CREATA:');
  console.log('   ID:', azienda.id);
  console.log('   Nome:', azienda.nome);
  console.log('   Email:', azienda.email);
  console.log('   Piano:', azienda.piano);
  console.log('   Stato:', azienda.stato);
  console.log('   Owner User ID:', azienda.owner_user_id);

  // Verifica utente_azienda
  const { data: utenteAzienda, error: utenteError } = await supabase
    .from('utente_azienda')
    .select('*')
    .eq('azienda_id', azienda.id);

  console.log('\n📋 UTENTE_AZIENDA:');
  if (utenteError) {
    console.log('   ❌ Errore:', utenteError.message);
  } else if (!utenteAzienda || utenteAzienda.length === 0) {
    console.log('   ❌ NESSUN RECORD TROVATO!');
    console.log('   ⚠️  La insert in utente_azienda è fallita!');
  } else {
    console.log('   ✅ Record trovati:', utenteAzienda.length);
    utenteAzienda.forEach((u, i) => {
      console.log(`   ${i+1}. User ID:`, u.user_id);
      console.log(`      Ruolo:`, u.ruolo);
      console.log(`      Attivo:`, u.attivo);
    });
  }

  // Verifica RLS policies su utente_azienda
  console.log('\n🔒 VERIFICA RLS POLICIES:');
  const { data: policies } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'utente_azienda');

  if (policies && policies.length > 0) {
    console.log(`   ✅ ${policies.length} policies trovate:`);
    policies.forEach(p => {
      console.log(`      - ${p.policyname} (${p.cmd})`);
    });
  } else {
    console.log('   ❌ NESSUNA RLS POLICY TROVATA!');
    console.log('   ⚠️  Le RLS policies non sono state create!');
  }

  // Verifica auto-seed
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

  console.log('\n🔧 AUTO-SEED:');
  console.log(`   Magazzini: ${magazzini?.length || 0}`);
  console.log(`   Aliquote IVA: ${iva?.length || 0}`);
  console.log(`   Causali: ${causali?.length || 0}`);

  console.log('\n' + '='.repeat(70));
}

checkSignup();
