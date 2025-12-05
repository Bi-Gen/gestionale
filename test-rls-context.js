// Test RLS con contesto utente reale
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testRLSContext() {
  console.log('🧪 TEST RLS CON CONTESTO UTENTE\n');

  // 1. Login come Mario Rossi
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'mario.rossi@example.com',
    password: 'Password123!'
  });

  if (authError) {
    console.log('❌ Errore login:', authError);
    return;
  }

  console.log('✅ Login OK, user:', authData.user.id);
  console.log('   Session token presente:', !!authData.session?.access_token);

  // 2. Test funzioni helper
  console.log('\n🔧 TEST FUNZIONI HELPER:');

  const { data: aziendaId, error: azErr } = await supabase.rpc('get_user_azienda_id');
  console.log('   get_user_azienda_id():', aziendaId || '❌ NULL', azErr || '');

  const { data: hasPerm, error: permErr } = await supabase.rpc('user_has_permission', {
    p_resource: 'anagrafica',
    p_action: 'write'
  });
  console.log('   user_has_permission(anagrafica, write):', hasPerm ? '✅ TRUE' : '❌ FALSE', permErr || '');

  const { data: isOwn, error: ownErr } = await supabase.rpc('is_owner');
  console.log('   is_owner():', isOwn ? '✅ TRUE' : '❌ FALSE', ownErr || '');

  // 3. Test debug_user_info
  const { data: debugInfo, error: debugErr } = await supabase.rpc('debug_user_info');
  console.log('\n📋 DEBUG USER INFO:');
  if (debugErr) {
    console.log('❌ Errore:', debugErr);
  } else {
    console.log(JSON.stringify(debugInfo, null, 2));
  }

  // 4. Test direct SELECT su utente_azienda
  console.log('\n📊 TEST DIRECT SELECT utente_azienda:');
  const { data: uaData, error: uaErr } = await supabase
    .from('utente_azienda')
    .select('*')
    .eq('user_id', authData.user.id);

  if (uaErr) {
    console.log('❌ Errore:', uaErr);
  } else {
    console.log('✅ Found:', uaData.length, 'rows');
    if (uaData.length > 0) {
      console.log('   Azienda ID:', uaData[0].azienda_id);
      console.log('   Ruolo:', uaData[0].ruolo);
      console.log('   Permessi anagrafica:', uaData[0].permessi.anagrafica);
    }
  }

  // 5. Test INSERT su soggetto (questo dovrebbe fallire con RLS)
  console.log('\n🔒 TEST INSERT soggetto:');

  // Prima get azienda_id manualmente
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', authData.user.id)
    .single();

  if (!utenteAzienda) {
    console.log('❌ Non trovato utente_azienda');
    return;
  }

  const testFornitore = {
    azienda_id: utenteAzienda.azienda_id,
    tipo: ['fornitore'],
    ragione_sociale: 'Test RLS Fornitore',
    partita_iva: '12345678901'
  };

  const { data: insertData, error: insertErr } = await supabase
    .from('soggetto')
    .insert([testFornitore])
    .select();

  if (insertErr) {
    console.log('❌ INSERT FAILED:', insertErr.message);
    console.log('   Code:', insertErr.code);
    console.log('   Details:', insertErr.details);
  } else {
    console.log('✅ INSERT OK! ID:', insertData[0].id);

    // Cleanup
    await supabase.from('soggetto').delete().eq('id', insertData[0].id);
    console.log('   (rimosso test record)');
  }

  await supabase.auth.signOut();
  console.log('\n✅ Test completato\n');
}

testRLSContext();
