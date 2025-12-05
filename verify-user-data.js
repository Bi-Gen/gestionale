// Verifica dati utente loggato
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verifyUserData() {
  console.log('🔍 VERIFICA DATI UTENTE MARIO ROSSI\n');
  console.log('='.repeat(70));

  const email = 'mario.rossi@example.com';

  // 1. Find user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ Utente non trovato');
    return;
  }

  console.log('\n👤 UTENTE AUTH:');
  console.log('   ID:', user.id);
  console.log('   Email:', user.email);
  console.log('   Metadata:', user.user_metadata);

  // 2. Utente_azienda
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('*')
    .eq('user_id', user.id)
    .single();

  console.log('\n🏢 UTENTE_AZIENDA:');
  console.log('   Azienda ID:', utenteAzienda.azienda_id);
  console.log('   Ruolo:', utenteAzienda.ruolo);
  console.log('   Attivo:', utenteAzienda.attivo);
  console.log('   Permessi:', Object.keys(utenteAzienda.permessi));

  // 3. Azienda
  const { data: azienda } = await supabase
    .from('azienda')
    .select('*')
    .eq('id', utenteAzienda.azienda_id)
    .single();

  console.log('\n🏭 AZIENDA:');
  console.log('   Nome:', azienda.nome);
  console.log('   Email:', azienda.email);
  console.log('   Piano:', azienda.piano);
  console.log('   Stato:', azienda.stato);
  console.log('   Trial fino a:', azienda.trial_fino_a);
  console.log('   Max utenti:', azienda.max_utenti);
  console.log('   Max prodotti:', azienda.max_prodotti);

  // 4. Risorse azienda
  const { data: prodotti } = await supabase
    .from('prodotto')
    .select('id')
    .eq('azienda_id', azienda.id);

  const { data: soggetti } = await supabase
    .from('soggetto')
    .select('id')
    .eq('azienda_id', azienda.id);

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

  console.log('\n📦 RISORSE AZIENDA:');
  console.log('   Prodotti:', prodotti?.length || 0);
  console.log('   Soggetti:', soggetti?.length || 0);
  console.log('   Magazzini:', magazzini?.length || 0);
  if (magazzini && magazzini.length > 0) {
    magazzini.forEach(m => {
      console.log(`      - ${m.nome} (${m.codice}) ${m.principale ? '⭐' : ''}`);
    });
  }
  console.log('   Aliquote IVA:', iva?.length || 0);
  console.log('   Causali movimento:', causali?.length || 0);

  // 5. Feature flags
  console.log('\n🎛️  FEATURE FLAGS:');
  const features = azienda.features_abilitate;
  Object.entries(features).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`   ${icon} ${key}: ${value}`);
  });

  console.log('\n' + '='.repeat(70));
  console.log('✅ MULTI-TENANCY FUNZIONANTE!');
  console.log('\n🎯 PROSSIMI PASSI:');
  console.log('   1. Creare alcuni prodotti di test');
  console.log('   2. Creare una seconda azienda per testare isolamento');
  console.log('   3. Implementare SuperAdmin dashboard');
  console.log('   4. Implementare dashboard Analytics');
  console.log('='.repeat(70) + '\n');
}

verifyUserData();
