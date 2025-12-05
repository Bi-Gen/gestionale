// Seed IVA e Causali per azienda Mario Rossi
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedIvaCausali() {
  console.log('🌱 SEED IVA E CAUSALI\n');

  const aziendaId = 'fa724a7c-a551-46da-b30a-19b8ef710b8d';

  try {
    // 1. Seed Aliquote IVA
    console.log('📋 Creazione Aliquote IVA...');

    const iva = [
      { codice: 'IVA22', descrizione: 'IVA Ordinaria 22%', percentuale: 22.00 },
      { codice: 'IVA10', descrizione: 'IVA Ridotta 10%', percentuale: 10.00 },
      { codice: 'IVA4', descrizione: 'IVA Minima 4%', percentuale: 4.00 },
      { codice: 'IVA0', descrizione: 'IVA Esente 0%', percentuale: 0.00 }
    ];

    for (const item of iva) {
      const { error } = await supabase
        .from('aliquota_iva')
        .insert({
          azienda_id: aziendaId,
          ...item,
          attiva: true
        });

      if (error) {
        console.log(`   ❌ ${item.codice}: ${error.message}`);
      } else {
        console.log(`   ✅ ${item.codice} - ${item.descrizione}`);
      }
    }

    // 2. Seed Causali Movimento
    console.log('\n📋 Creazione Causali Movimento...');

    const causali = [
      { codice: 'CAR', descrizione: 'Carico Merce', tipo: 'carico', segno: 1 },
      { codice: 'SCA', descrizione: 'Scarico Merce', tipo: 'scarico', segno: -1 },
      { codice: 'VEN', descrizione: 'Vendita', tipo: 'scarico', segno: -1 },
      { codice: 'ACQ', descrizione: 'Acquisto', tipo: 'carico', segno: 1 },
      { codice: 'RES', descrizione: 'Reso da Cliente', tipo: 'carico', segno: 1 },
      { codice: 'RESF', descrizione: 'Reso a Fornitore', tipo: 'scarico', segno: -1 },
      { codice: 'TRAS', descrizione: 'Trasferimento', tipo: 'trasferimento', segno: 0 },
      { codice: 'RETT+', descrizione: 'Rettifica Positiva', tipo: 'rettifica', segno: 1 },
      { codice: 'RETT-', descrizione: 'Rettifica Negativa', tipo: 'rettifica', segno: -1 }
    ];

    for (const item of causali) {
      const { error } = await supabase
        .from('causale_movimento')
        .insert({
          azienda_id: aziendaId,
          ...item,
          attivo: true
        });

      if (error) {
        console.log(`   ❌ ${item.codice}: ${error.message}`);
      } else {
        console.log(`   ✅ ${item.codice} - ${item.descrizione}`);
      }
    }

    console.log('\n✅ SEED COMPLETATO!\n');

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
  }
}

seedIvaCausali();
