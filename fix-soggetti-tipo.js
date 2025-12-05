const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  // Recupera tutti i soggetti senza tipo_soggetto_id ma con tipo array
  const { data: soggetti, error: fetchError } = await supabase
    .from('soggetto')
    .select('id, tipo, azienda_id, tipo_soggetto_id, ragione_sociale')
    .is('tipo_soggetto_id', null)
    .not('tipo', 'is', null);

  if (fetchError) {
    console.error('Errore fetch:', fetchError);
    process.exit(1);
  }

  console.log(`Trovati ${soggetti.length} soggetti da aggiornare\n`);

  // Recupera tutti i tipi soggetto
  const { data: tipi } = await supabase
    .from('tipi_soggetto')
    .select('id, codice, azienda_id');

  let updated = 0;

  for (const soggetto of soggetti) {
    if (!Array.isArray(soggetto.tipo) || soggetto.tipo.length === 0) continue;

    // Determina il codice dal vecchio tipo array
    let codice = null;
    if (soggetto.tipo.includes('cliente')) codice = 'CLI';
    else if (soggetto.tipo.includes('fornitore')) codice = 'FOR';
    else if (soggetto.tipo.includes('agente')) codice = 'AGE';

    if (!codice) continue;

    // Trova il tipo_soggetto_id corretto per questa azienda
    const tipo = tipi.find(t =>
      t.codice === codice && t.azienda_id === soggetto.azienda_id
    );

    if (tipo) {
      const { error: updateError } = await supabase
        .from('soggetto')
        .update({ tipo_soggetto_id: tipo.id })
        .eq('id', soggetto.id);

      if (updateError) {
        console.error(`Errore update soggetto ${soggetto.id}:`, updateError);
      } else {
        console.log(`✓ ${soggetto.ragione_sociale}: tipo_soggetto_id = ${tipo.id} (${codice})`);
        updated++;
      }
    }
  }

  console.log(`\n✅ Aggiornati ${updated}/${soggetti.length} soggetti`);
  process.exit(0);
})();
