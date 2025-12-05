// Quick fix: applica solo le parti critiche usando query Supabase standard
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function quickFix() {
  console.log('🔧 QUICK FIX: Backfill auto-seed per aziende esistenti\n');

  try {
    // Get tutte le aziende
    const { data: aziende, error: aziendeError } = await supabase
      .from('azienda')
      .select('id, nome');

    if (aziendeError) throw aziendeError;

    console.log(`📋 Trovate ${aziende.length} aziende\n`);

    for (const azienda of aziende) {
      console.log(`🏢 Processing: ${azienda.nome} (${azienda.id})`);

      // 1. Crea magazzino se non esiste
      const { data: existingMag } = await supabase
        .from('magazzino')
        .select('id')
        .eq('azienda_id', azienda.id)
        .eq('principale', true)
        .single();

      if (!existingMag) {
        const { error: magError } = await supabase
          .from('magazzino')
          .insert({
            azienda_id: azienda.id,
            codice: 'MAG-PRINC',
            nome: 'Magazzino Principale',
            principale: true,
            attivo: true
          });

        if (magError) {
          console.log('   ❌ Errore magazzino:', magError.message);
        } else {
          console.log('   ✅ Magazzino principale creato');
        }
      } else {
        console.log('   ✓ Magazzino già esistente');
      }

      // 2. Crea aliquote IVA
      const ivaToCreate = [
        { codice: 'IVA22', descrizione: 'IVA Ordinaria 22%', percentuale: 22.00, tipo: 'ordinaria' },
        { codice: 'IVA10', descrizione: 'IVA Ridotta 10%', percentuale: 10.00, tipo: 'ridotta' },
        { codice: 'IVA4', descrizione: 'IVA Minima 4%', percentuale: 4.00, tipo: 'minima' },
        { codice: 'IVA0', descrizione: 'IVA Esente 0%', percentuale: 0.00, tipo: 'esente' }
      ];

      for (const iva of ivaToCreate) {
        const { data: existingIva } = await supabase
          .from('aliquota_iva')
          .select('id')
          .eq('azienda_id', azienda.id)
          .eq('codice', iva.codice)
          .single();

        if (!existingIva) {
          await supabase
            .from('aliquota_iva')
            .insert({
              azienda_id: azienda.id,
              ...iva,
              attivo: true
            });
        }
      }
      console.log('   ✅ Aliquote IVA create');

      // 3. Crea causali movimento
      const causaliToCreate = [
        { codice: 'CAR', descrizione: 'Carico Merce', tipo: 'carico', impatto_giacenza: 1 },
        { codice: 'SCA', descrizione: 'Scarico Merce', tipo: 'scarico', impatto_giacenza: -1 },
        { codice: 'VEN', descrizione: 'Vendita', tipo: 'scarico', impatto_giacenza: -1 },
        { codice: 'ACQ', descrizione: 'Acquisto', tipo: 'carico', impatto_giacenza: 1 },
        { codice: 'RES', descrizione: 'Reso da Cliente', tipo: 'carico', impatto_giacenza: 1 },
        { codice: 'RESF', descrizione: 'Reso a Fornitore', tipo: 'scarico', impatto_giacenza: -1 },
        { codice: 'TRAS', descrizione: 'Trasferimento', tipo: 'neutro', impatto_giacenza: 0 },
        { codice: 'RETT+', descrizione: 'Rettifica Positiva', tipo: 'carico', impatto_giacenza: 1 },
        { codice: 'RETT-', descrizione: 'Rettifica Negativa', tipo: 'scarico', impatto_giacenza: -1 }
      ];

      for (const causale of causaliToCreate) {
        const { data: existingCausale } = await supabase
          .from('causale_movimento')
          .select('id')
          .eq('azienda_id', azienda.id)
          .eq('codice', causale.codice)
          .single();

        if (!existingCausale) {
          await supabase
            .from('causale_movimento')
            .insert({
              azienda_id: azienda.id,
              ...causale,
              attivo: true
            });
        }
      }
      console.log('   ✅ Causali movimento create\n');
    }

    console.log('='.repeat(70));
    console.log('✅ QUICK FIX COMPLETATO!');
    console.log('\n⚠️  NOTA: Le RLS policies devono essere applicate manualmente');
    console.log('   dal Supabase Dashboard con il file SQL migration\n');
    console.log('='.repeat(70) + '\n');

    // Verifica finale
    console.log('🔍 VERIFICA FINALE:\n');
    const { data: lastAzienda } = await supabase
      .from('azienda')
      .select('id, nome')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: mag } = await supabase.from('magazzino').select('id').eq('azienda_id', lastAzienda.id);
    const { data: iva } = await supabase.from('aliquota_iva').select('id').eq('azienda_id', lastAzienda.id);
    const { data: causali } = await supabase.from('causale_movimento').select('id').eq('azienda_id', lastAzienda.id);

    console.log(`🏢 ${lastAzienda.nome}:`);
    console.log(`   Magazzini: ${mag?.length || 0}`);
    console.log(`   Aliquote IVA: ${iva?.length || 0}`);
    console.log(`   Causali: ${causali?.length || 0}\n`);

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    console.error(error);
  }
}

quickFix();
