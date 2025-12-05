const fs = require('fs');

// Leggi i dati estratti
const data = JSON.parse(fs.readFileSync('test-data-complete.json', 'utf8'));

// Funzione per convertire date Excel in formato SQL
function excelDateToSQL(excelDate) {
  if (!excelDate || excelDate === 0) return null;
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

// Funzione per escape SQL
function sqlEscape(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
}

console.log('📝 GENERAZIONE SQL DI INSERIMENTO DATI TEST\n');
console.log('='.repeat(80));

let sql = '';

// =====================================================
// HEADER
// =====================================================
sql += '-- =====================================================\n';
sql += '-- SQL DI INSERIMENTO DATI TEST\n';
sql += '-- Cliente: cl32 (Bulgar International Ltd)\n';
sql += '-- Fornitore: fo14 (Qingdao Runjie)\n';
sql += '-- Prodotto: TLB451X1BL\n';
sql += '-- Movimenti: 15 (12 vendite + 3 acquisti)\n';
sql += '-- =====================================================\n\n';

sql += '-- NOTA: Questo script deve essere eseguito dopo il login come utente normale\n';
sql += '-- Il contesto azienda_id sarà automaticamente impostato dall\'utente loggato\n\n';

// =====================================================
// 1. INSERISCI CLIENTE
// =====================================================
console.log('\n📋 1. Generando SQL per CLIENTE...');

if (data.movimenti && data.movimenti.length > 0) {
  const primaVendita = data.movimenti.find(m => m.Cod === 'cl32');

  if (primaVendita) {
    sql += '-- =====================================================\n';
    sql += '-- 1. CLIENTE\n';
    sql += '-- =====================================================\n\n';

    sql += `-- Cliente: ${primaVendita.Cod} - ${primaVendita.Soggetto}\n`;
    sql += `INSERT INTO soggetto (codice, ragione_sociale, tipo, nazione, valuta, agente, provvigione_agente_perc, giorni_pagamento, settore)\n`;
    sql += `VALUES (\n`;
    sql += `  '${primaVendita.Cod}',\n`;
    sql += `  ${sqlEscape(primaVendita.Soggetto)},\n`;
    sql += `  'cliente',\n`;
    sql += `  'BG',  -- Bulgaria\n`;
    sql += `  'EUR',\n`;
    sql += `  ${sqlEscape(primaVendita.Agente)},\n`;
    sql += `  ${primaVendita['Provvigione Agente (%)'] || 0},\n`;
    sql += `  ${primaVendita['GG. Pagamento'] || 0},\n`;
    sql += `  ${sqlEscape(primaVendita['Campo Regione'])}\n`;
    sql += `);\n\n`;

    console.log(`   ✅ SQL generato per cliente ${primaVendita.Cod}`);
  }
}

// =====================================================
// 2. INSERISCI FORNITORE
// =====================================================
console.log('\n📋 2. Generando SQL per FORNITORE...');

if (data.movimenti && data.movimenti.length > 0) {
  const primoAcquisto = data.movimenti.find(m => m.Cod === 'fo14');

  if (primoAcquisto) {
    sql += '-- =====================================================\n';
    sql += '-- 2. FORNITORE\n';
    sql += '-- =====================================================\n\n';

    sql += `-- Fornitore: ${primoAcquisto.Cod} - ${primoAcquisto.Soggetto}\n`;
    sql += `INSERT INTO soggetto (codice, ragione_sociale, tipo, nazione, valuta, giorni_pagamento, settore)\n`;
    sql += `VALUES (\n`;
    sql += `  '${primoAcquisto.Cod}',\n`;
    sql += `  ${sqlEscape(primoAcquisto.Soggetto)},\n`;
    sql += `  'fornitore',\n`;
    sql += `  'CN',  -- China\n`;
    sql += `  'EUR',\n`;
    sql += `  ${primoAcquisto['GG. Pagamento'] || 0},\n`;
    sql += `  ${sqlEscape(primoAcquisto['Campo Regione'])}\n`;
    sql += `);\n\n`;

    console.log(`   ✅ SQL generato per fornitore ${primoAcquisto.Cod}`);
  }
}

// =====================================================
// 3. INSERISCI PRODOTTO
// =====================================================
console.log('\n📋 3. Generando SQL per PRODOTTO...');

if (data.movimenti && data.movimenti.length > 0) {
  const movimento = data.movimenti[0];

  sql += '-- =====================================================\n';
  sql += '-- 3. PRODOTTO\n';
  sql += '-- =====================================================\n\n';

  // Prima inseriamo il brand se non esiste
  if (movimento.Brand) {
    sql += `-- Brand\n`;
    sql += `INSERT INTO brand (nome)\n`;
    sql += `VALUES (${sqlEscape(movimento.Brand)})\n`;
    sql += `ON CONFLICT (nome) DO NOTHING;\n\n`;
  }

  sql += `-- Prodotto: ${movimento.Prodotto}\n`;
  sql += `INSERT INTO prodotto (\n`;
  sql += `  codice,\n`;
  sql += `  nome,\n`;
  sql += `  brand_id,\n`;
  sql += `  unita_misura,\n`;
  sql += `  cartoni_per_pedana,\n`;
  sql += `  prezzo_magazzino\n`;
  sql += `) VALUES (\n`;
  sql += `  '${movimento.Prodotto}',\n`;
  sql += `  ${sqlEscape(movimento['Descrizione Prodotto'])},\n`;
  sql += `  (SELECT id FROM brand WHERE nome = ${sqlEscape(movimento.Brand)} LIMIT 1),\n`;
  sql += `  '${movimento['Unità']}',\n`;
  sql += `  ${movimento['Campo CRT x PED'] || 'NULL'},\n`;
  sql += `  ${movimento['Prezzo Imponibile'] || 0}\n`;
  sql += `);\n\n`;

  console.log(`   ✅ SQL generato per prodotto ${movimento.Prodotto}`);
}

// =====================================================
// 4. INSERISCI MAGAZZINI
// =====================================================
console.log('\n📋 4. Generando SQL per MAGAZZINI...');

const magazzini = new Set();
data.movimenti.forEach(m => {
  if (m.Magazzino) magazzini.add(m.Magazzino);
});

if (magazzini.size > 0) {
  sql += '-- =====================================================\n';
  sql += '-- 4. MAGAZZINI\n';
  sql += '-- =====================================================\n\n';

  magazzini.forEach(mag => {
    sql += `INSERT INTO magazzino (codice, nome)\n`;
    sql += `VALUES ('${mag.substring(0, 10)}', ${sqlEscape(mag)})\n`;
    sql += `ON CONFLICT (codice) DO NOTHING;\n\n`;
  });

  console.log(`   ✅ SQL generato per ${magazzini.size} magazzini`);
}

// =====================================================
// 5. NOTE IMPORTANTI
// =====================================================
sql += '-- =====================================================\n';
sql += '-- 5. MOVIMENTI\n';
sql += '-- =====================================================\n\n';

sql += '-- NOTA: Per inserire i movimenti è necessario:\n';
sql += '-- 1. Conoscere gli ID di causale_documento per "Vendita" e "Ordine Passivo" e "Ordine Attivo"\n';
sql += '-- 2. Conoscere gli ID di aliquota_iva per IVA esente (0%)\n';
sql += '-- 3. Gli ID di soggetto, prodotto e magazzino appena creati\n\n';

sql += '-- Query per ottenere gli ID necessari:\n';
sql += `SELECT id, codice, descrizione FROM causale_documento WHERE codice IN ('VEN', 'OPA', 'OAT');\n`;
sql += `SELECT id, percentuale, descrizione FROM aliquota_iva WHERE percentuale = 0;\n`;
sql += `SELECT id, codice, ragione_sociale FROM soggetto WHERE codice IN ('cl32', 'fo14');\n`;
sql += `SELECT id, codice, nome FROM prodotto WHERE codice = 'TLB451X1BL';\n`;
sql += `SELECT id, codice, nome FROM magazzino;\n\n`;

// =====================================================
// 6. TEMPLATE MOVIMENTO
// =====================================================
sql += '-- =====================================================\n';
sql += '-- 6. TEMPLATE PER INSERIMENTO MOVIMENTI\n';
sql += '-- =====================================================\n\n';

sql += '-- Dopo aver ottenuto gli ID, utilizzare questo template per ogni movimento:\n\n';

sql += '/*\n';
sql += 'DO $$\n';
sql += 'DECLARE\n';
sql += '  v_movimento_id INT;\n';
sql += '  v_causale_id INT;\n';
sql += '  v_soggetto_id INT;\n';
sql += '  v_prodotto_id INT;\n';
sql += '  v_magazzino_id INT;\n';
sql += '  v_aliquota_iva_id INT;\n';
sql += 'BEGIN\n\n';

// Esempio per la prima vendita
const vendita = data.movimenti[0];

sql += '  -- Ottieni ID necessari\n';
sql += `  SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'VEN' LIMIT 1;\n`;
sql += `  SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' LIMIT 1;\n`;
sql += `  SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' LIMIT 1;\n`;
sql += `  SELECT id INTO v_magazzino_id FROM magazzino WHERE nome = ${sqlEscape(vendita.Magazzino)} LIMIT 1;\n`;
sql += `  SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;\n\n`;

sql += '  -- Crea movimento\n';
sql += '  INSERT INTO movimento (\n';
sql += '    causale_id,\n';
sql += '    soggetto_id,\n';
sql += '    magazzino_id,\n';
sql += '    data_movimento,\n';
sql += '    numero_documento,\n';
sql += '    valuta,\n';
sql += '    agente,\n';
sql += '    provvigione_agente_perc,\n';
sql += '    provvigione_agente_valore,\n';
sql += '    termini_resa,\n';
sql += '    vettore,\n';
sql += '    centro_costo,\n';
sql += '    note,\n';
sql += '    imponibile,\n';
sql += '    iva,\n';
sql += '    totale\n';
sql += '  ) VALUES (\n';
sql += '    v_causale_id,\n';
sql += '    v_soggetto_id,\n';
sql += '    v_magazzino_id,\n';
sql += `    '${excelDateToSQL(vendita['Data movimento'])}',\n`;
sql += `    ${sqlEscape(vendita['n° documento'])},\n`;
sql += `    '${vendita.Valuta}',\n`;
sql += `    ${sqlEscape(vendita.Agente)},\n`;
sql += `    ${vendita['Provvigione Agente (%)'] || 0},\n`;
sql += `    ${vendita['Provvigione Agente (Valore)'] || 0},\n`;
sql += `    ${sqlEscape(vendita['Termini di Resa'])},\n`;
sql += `    ${sqlEscape(vendita.Vettore)},\n`;
sql += `    ${sqlEscape(vendita['Centro di Costo'])},\n`;
sql += `    ${sqlEscape(vendita.Note)},\n`;
sql += `    ${Math.abs(vendita['Valore Imponibile'] || 0)},\n`;
sql += `    ${vendita.Iva || 0},\n`;
sql += `    ${Math.abs(vendita['Valore Iva Compresa'] || 0)}\n`;
sql += '  ) RETURNING id INTO v_movimento_id;\n\n';

sql += '  -- Crea dettaglio movimento\n';
sql += '  INSERT INTO dettaglio_movimento (\n';
sql += '    movimento_id,\n';
sql += '    prodotto_id,\n';
sql += '    descrizione,\n';
sql += '    quantita,\n';
sql += '    unita_misura,\n';
sql += '    prezzo_unitario,\n';
sql += '    imponibile,\n';
sql += '    aliquota_iva_id,\n';
sql += '    iva,\n';
sql += '    totale,\n';
sql += '    brand\n';
sql += '  ) VALUES (\n';
sql += '    v_movimento_id,\n';
sql += '    v_prodotto_id,\n';
sql += `    ${sqlEscape(vendita['Descrizione Prodotto'])},\n`;
sql += `    ${Math.abs(vendita[' Quantità '] || 0)},\n`;
sql += `    '${vendita['Unità']}',\n`;
sql += `    ${vendita['Prezzo Imponibile'] || 0},\n`;
sql += `    ${Math.abs(vendita['Valore Imponibile'] || 0)},\n`;
sql += '    v_aliquota_iva_id,\n';
sql += `    ${vendita.Iva || 0},\n`;
sql += `    ${Math.abs(vendita['Valore Iva Compresa'] || 0)},\n`;
sql += `    ${sqlEscape(vendita.Brand)}\n`;
sql += '  );\n\n';

sql += 'END $$;\n';
sql += '*/\n\n';

// =====================================================
// 7. RIEPILOGO DATI DA IMPORTARE
// =====================================================
sql += '-- =====================================================\n';
sql += '-- 7. RIEPILOGO DATI DA IMPORTARE\n';
sql += '-- =====================================================\n\n';

sql += '-- Vendite (12):\n';
const vendite = data.movimenti.filter(m => m['Tipo movimento'] === 'Scarico');
vendite.forEach((v, idx) => {
  sql += `--   ${idx + 1}. Doc: ${v['n° documento']}, Data: ${excelDateToSQL(v['Data movimento'])}, Qty: ${v[' Quantità ']} CRT, Prezzo: €${v['Prezzo Imponibile']}, Tot: €${Math.abs(v['Valore Imponibile'])}\n`;
});

sql += '\n-- Acquisti (3):\n';
const acquisti = data.movimenti.filter(m => m['Tipo movimento'] === 'Carico');
acquisti.forEach((a, idx) => {
  sql += `--   ${idx + 1}. Doc: ${a['n° documento']}, Data: ${excelDateToSQL(a['Data movimento'])}, Qty: ${a[' Quantità ']} CRT, Prezzo: €${a['Prezzo Imponibile']}, Tot: €${Math.abs(a['Valore Imponibile'])}\n`;
});

sql += '\n-- Totale vendite: €' + vendite.reduce((sum, v) => sum + Math.abs(v['Valore Imponibile'] || 0), 0).toFixed(2) + '\n';
sql += '-- Totale acquisti: €' + acquisti.reduce((sum, a) => sum + Math.abs(a['Valore Imponibile'] || 0), 0).toFixed(2) + '\n';

const margine = vendite.reduce((sum, v) => sum + Math.abs(v['Valore Imponibile'] || 0), 0) -
                acquisti.reduce((sum, a) => sum + Math.abs(a['Valore Imponibile'] || 0), 0);
sql += `-- Margine lordo: €${margine.toFixed(2)}\n`;

const marginePerc = (margine / vendite.reduce((sum, v) => sum + Math.abs(v['Valore Imponibile'] || 0), 0)) * 100;
sql += `-- Margine %: ${marginePerc.toFixed(2)}%\n`;

// Salva il file
const outputFile = 'test-data-insert-complete.sql';
fs.writeFileSync(outputFile, sql, 'utf8');

console.log('\n\n' + '='.repeat(80));
console.log('✅ SQL GENERATO CON SUCCESSO!');
console.log('='.repeat(80));
console.log(`\n📁 File salvato: ${outputFile}`);
console.log('\n📊 Riepilogo:');
console.log(`   - 1 Cliente (cl32)`);
console.log(`   - 1 Fornitore (fo14)`);
console.log(`   - 1 Prodotto (TLB451X1BL)`);
console.log(`   - ${magazzini.size} Magazzini`);
console.log(`   - 15 Movimenti (12 vendite + 3 acquisti)`);
console.log(`\n💰 Analisi economica:`);
console.log(`   - Totale vendite: €${vendite.reduce((sum, v) => sum + Math.abs(v['Valore Imponibile'] || 0), 0).toFixed(2)}`);
console.log(`   - Totale acquisti: €${acquisti.reduce((sum, a) => sum + Math.abs(a['Valore Imponibile'] || 0), 0).toFixed(2)}`);
console.log(`   - Margine lordo: €${margine.toFixed(2)}`);
console.log(`   - Margine %: ${marginePerc.toFixed(2)}%`);

console.log('\n🎯 Prossimi passi:');
console.log('   1. Eseguire la prima parte dello script (cliente, fornitore, prodotto, magazzini)');
console.log('   2. Ottenere gli ID dalle query di verifica');
console.log('   3. Utilizzare il template per inserire i 15 movimenti');
console.log('   4. Verificare i risultati confrontandoli con Excel');
