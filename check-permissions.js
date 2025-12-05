// Verifica permessi utente per debug RLS
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkPermissions() {
  console.log('🔍 VERIFICA PERMESSI RLS\n');

  const email = 'mario.rossi@example.com';

  // 1. Get user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);

  console.log('👤 User ID:', user.id);

  // 2. Get utente_azienda con permessi
  const { data: utenteAzienda, error: uaError } = await supabase
    .from('utente_azienda')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (uaError) {
    console.log('❌ Errore utente_azienda:', uaError);
    return;
  }

  console.log('\n🏢 UTENTE_AZIENDA:');
  console.log('   Azienda ID:', utenteAzienda.azienda_id);
  console.log('   Ruolo:', utenteAzienda.ruolo);
  console.log('   Attivo:', utenteAzienda.attivo);
  console.log('   Invito accettato:', utenteAzienda.invito_accettato);
  console.log('\n📋 PERMESSI:');
  console.log(JSON.stringify(utenteAzienda.permessi, null, 2));

  // 3. Test funzione helper RLS
  console.log('\n🔧 TEST FUNZIONE user_has_permission:');

  const { data: hasPermAnagrafica, error: permError } = await supabase
    .rpc('user_has_permission', {
      p_resource: 'anagrafica',
      p_action: 'write'
    });

  if (permError) {
    console.log('❌ Errore chiamata RPC:', permError);
  } else {
    console.log('   anagrafica/write:', hasPermAnagrafica ? '✅ TRUE' : '❌ FALSE');
  }

  // 4. Test get_user_azienda_id
  const { data: aziendaId, error: azError } = await supabase
    .rpc('get_user_azienda_id');

  if (azError) {
    console.log('❌ Errore get_user_azienda_id:', azError);
  } else {
    console.log('   get_user_azienda_id:', aziendaId);
    console.log('   Match:', aziendaId === utenteAzienda.azienda_id ? '✅' : '❌');
  }

  // 5. Verifica policies su soggetto
  console.log('\n🔒 RLS POLICIES su soggetto:');
  const { data: policies, error: polError } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('schemaname', 'public')
    .eq('tablename', 'soggetto');

  if (polError) {
    console.log('❌ Errore:', polError);
  } else {
    console.log(`   Trovate ${policies.length} policies:`);
    policies.forEach(p => {
      console.log(`   - ${p.policyname} (${p.cmd})`);
    });
  }

  console.log('\n');
}

checkPermissions();
