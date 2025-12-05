const XLSX = require('xlsx');
const fs = require('fs');

// Path del file Excel
const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

// Dati da estrarre
const CLIENTE = 'Cl32';
const ARTICOLO = 'TLB451X1BL';
const FORNITORE = 'Fo14';

console.log('🔍 ESTRAZIONE DATI TEST DA EXCEL\n');
console.log('='.repeat(80));
console.log(`\n📦 Dati da estrarre:`);
console.log(`   Cliente:    ${CLIENTE}`);
console.log(`   Articolo:   ${ARTICOLO}`);
console.log(`   Fornitore:  ${FORNITORE}`);
console.log('\n' + '='.repeat(80));

try {
  // Leggi il file Excel
  const workbook = XLSX.readFile(filePath);
  console.log('\n✅ File Excel caricato con successo!\n');

  const result = {
    cliente: null,
    fornitore: null,
    articolo: null,
    movimenti: [],
    listini: [],
    dettagli: {}
  };

  // =====================================================
  // 1. ESTRAI CLIENTE (CL32) da "Debitori - Creditori"
  // =====================================================
  console.log('📋 1. Estrazione CLIENTE...');

  const sheetDebitoriCreditori = workbook.Sheets['Debitori - Creditori'];
  if (sheetDebitoriCreditori) {
    const data = XLSX.utils.sheet_to_json(sheetDebitoriCreditori);
    const cliente = data.find(row =>
      (row.Cod && row.Cod.toString().toUpperCase() === CLIENTE.toUpperCase()) ||
      (row['Codice cliente'] && row['Codice cliente'].toString().toUpperCase() === CLIENTE.toUpperCase())
    );

    if (cliente) {
      result.cliente = cliente;
      console.log('   ✅ Cliente trovato:');
      console.log(`      Codice: ${cliente.Cod || cliente['Codice cliente']}`);
      console.log(`      Nome: ${cliente.Soggetto || cliente['Ragione Sociale']}`);
      console.log(`      P.IVA: ${cliente['P.IVA'] || cliente['Partita Iva']}`);
      console.log(`      Agente: ${cliente.Agente || 'N/A'}`);
      console.log(`      Listino: ${cliente['Listino di riferimento'] || 'N/A'}`);
      console.log(`      Tipo Pagamento: ${cliente['Tipo Pagamento'] || 'N/A'}`);
      console.log(`      Provvigione Agente: ${cliente['Provvigione Agente (%)'] || 'N/A'}%`);
    } else {
      console.log(`   ❌ Cliente ${CLIENTE} non trovato!`);
    }
  }

  // =====================================================
  // 2. ESTRAI FORNITORE (FO14) da "Debitori - Creditori"
  // =====================================================
  console.log('\n📋 2. Estrazione FORNITORE...');

  if (sheetDebitoriCreditori) {
    const data = XLSX.utils.sheet_to_json(sheetDebitoriCreditori);
    const fornitore = data.find(row =>
      (row.Cod && row.Cod.toString().toUpperCase() === FORNITORE.toUpperCase()) ||
      (row['Codice Fornitore'] && row['Codice Fornitore'].toString().toUpperCase() === FORNITORE.toUpperCase())
    );

    if (fornitore) {
      result.fornitore = fornitore;
      console.log('   ✅ Fornitore trovato:');
      console.log(`      Codice: ${fornitore.Cod || fornitore['Codice Fornitore']}`);
      console.log(`      Nome: ${fornitore.Soggetto || fornitore['Ragione Sociale']}`);
      console.log(`      P.IVA: ${fornitore['P.IVA'] || fornitore['Partita Iva']}`);
      console.log(`      Paese: ${fornitore.Nazione || 'N/A'}`);
      console.log(`      Valuta: ${fornitore.Valuta || 'EUR'}`);
    } else {
      console.log(`   ❌ Fornitore ${FORNITORE} non trovato!`);
    }
  }

  // =====================================================
  // 3. ESTRAI ARTICOLO da "Anagrafica Articoli"
  // =====================================================
  console.log('\n📋 3. Estrazione ARTICOLO...');

  const sheetAnagraficaArticoli = workbook.Sheets['Anagrafica Articoli'];
  if (sheetAnagraficaArticoli) {
    const data = XLSX.utils.sheet_to_json(sheetAnagraficaArticoli);
    const articolo = data.find(row =>
      row['Codice Articolo'] && row['Codice Articolo'].toString().toUpperCase() === ARTICOLO.toUpperCase()
    );

    if (articolo) {
      result.articolo = articolo;
      console.log('   ✅ Articolo trovato:');
      console.log(`      Codice: ${articolo['Codice Articolo']}`);
      console.log(`      Nome: ${articolo['Descrizione Articolo'] || articolo.Nome}`);
      console.log(`      Brand: ${articolo.Brand || 'N/A'}`);
      console.log(`      Famiglia: ${articolo.Famiglia || 'N/A'}`);
      console.log(`      Macrofamiglia: ${articolo.Macrofamiglia || 'N/A'}`);
      console.log(`      Prezzo Magazzino: €${articolo['Prezzo a Magazzino'] || 0}`);
      console.log(`      Unità: ${articolo['Unità'] || articolo['Unità di misura']}`);
      console.log(`      Pezzi per Busta: ${articolo['Pezzi in Busta'] || 'N/A'}`);
      console.log(`      Buste per Cartone: ${articolo['Buste in Cartone'] || 'N/A'}`);
      console.log(`      Cartoni per Pedana: ${articolo['Cartoni per Pedana'] || 'N/A'}`);
      console.log(`      Lead Time: ${articolo['Lead Time'] || 'N/A'} giorni`);
      console.log(`      Scorta Minima: ${articolo['Scorta minima'] || 0}`);
      console.log(`      Fornitore Principale: ${articolo['Fornitore principale'] || 'N/A'}`);
    } else {
      console.log(`   ❌ Articolo ${ARTICOLO} non trovato!`);
    }
  }

  // =====================================================
  // 4. ESTRAI MOVIMENTI da "DataBase Movimenti"
  // =====================================================
  console.log('\n📋 4. Estrazione MOVIMENTI correlati...');

  const sheetDatabaseMovimenti = workbook.Sheets['DataBase Movimenti'];
  if (sheetDatabaseMovimenti) {
    const data = XLSX.utils.sheet_to_json(sheetDatabaseMovimenti);

    // Filtra movimenti che coinvolgono cliente, fornitore o articolo
    const movimenti = data.filter(row => {
      const codSoggetto = row['Cod'] || row['Cod. Soggetto'];
      const codProdotto = row['Prodotto'] || row['Codice Prodotto'];

      return (
        (codSoggetto && (
          codSoggetto.toString().toUpperCase() === CLIENTE.toUpperCase() ||
          codSoggetto.toString().toUpperCase() === FORNITORE.toUpperCase()
        )) ||
        (codProdotto && codProdotto.toString().toUpperCase() === ARTICOLO.toUpperCase())
      );
    });

    result.movimenti = movimenti;
    console.log(`   ✅ Trovati ${movimenti.length} movimenti correlati`);

    if (movimenti.length > 0) {
      console.log('\n   📊 Dettaglio movimenti:');
      movimenti.slice(0, 5).forEach((mov, idx) => {
        console.log(`\n      Movimento ${idx + 1}:`);
        console.log(`         Data: ${mov['Data movimento'] || 'N/A'}`);
        console.log(`         Causale: ${mov['Causale movimento'] || 'N/A'}`);
        console.log(`         Documento: ${mov['n° documento'] || 'N/A'}`);
        console.log(`         Soggetto: ${mov['Soggetto'] || 'N/A'} (${mov['Cod'] || 'N/A'})`);
        console.log(`         Prodotto: ${mov['Prodotto'] || 'N/A'}`);
        console.log(`         Quantità: ${mov['Quantità'] || 0} ${mov['Unità di Vendita'] || ''}`);
        console.log(`         Prezzo: €${mov['Prezzo Imponibile'] || 0}`);
        console.log(`         Imponibile: €${mov['Valore Imponibile'] || 0}`);
        console.log(`         Agente: ${mov['Agente'] || 'N/A'}`);
        console.log(`         Listino: ${mov['Listino di Riferim.'] || 'N/A'}`);
      });

      if (movimenti.length > 5) {
        console.log(`\n      ... e altri ${movimenti.length - 5} movimenti`);
      }
    }
  }

  // =====================================================
  // 5. ESTRAI LISTINI per l'articolo
  // =====================================================
  console.log('\n\n📋 5. Estrazione LISTINI...');

  const sheetListini = workbook.Sheets['Listini'];
  if (sheetListini) {
    const data = XLSX.utils.sheet_to_json(sheetListini);
    const listino = data.find(row =>
      row['Cod. Prodotto'] && row['Cod. Prodotto'].toString().toUpperCase() === ARTICOLO.toUpperCase()
    );

    if (listino) {
      result.listini = listino;
      console.log('   ✅ Listini trovati per articolo:');
      console.log(`      Prezzo Magazzino: €${listino['Prezzo a Magazzino'] || 0}`);

      // Mostra tutti i listini numerati
      for (let i = 1; i <= 9; i++) {
        const prezzoListino = listino[`Listino ${i}`];
        const provvigione = listino[`Provv. Listino ${i}`];
        if (prezzoListino) {
          console.log(`      Listino ${i}: €${prezzoListino} (provv. ${provvigione || 0}%)`);
        }
      }
    } else {
      console.log(`   ⚠️  Listini per articolo ${ARTICOLO} non trovati`);
    }
  }

  // =====================================================
  // 6. SALVA RISULTATI IN FILE JSON
  // =====================================================
  console.log('\n\n💾 Salvataggio risultati...');

  const outputFile = 'test-data-extracted.json';
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`   ✅ Dati salvati in: ${outputFile}`);

  // =====================================================
  // 7. GENERA SQL DI INSERIMENTO
  // =====================================================
  console.log('\n\n📝 Generazione script SQL di inserimento...');

  let sql = '-- =====================================================\n';
  sql += '-- DATI TEST ESTRATTI DA EXCEL\n';
  sql += `-- Cliente: ${CLIENTE}, Articolo: ${ARTICOLO}, Fornitore: ${FORNITORE}\n`;
  sql += '-- =====================================================\n\n';

  // SQL per CLIENTE
  if (result.cliente) {
    sql += '-- CLIENTE\n';
    sql += `INSERT INTO soggetto (codice, ragione_sociale, tipo, partita_iva, email, telefono, indirizzo, comune_id, provincia, nazione, agente, provvigione_agente_perc, listino_id, valuta, giorni_pagamento) VALUES (\n`;
    sql += `  '${result.cliente.Cod || CLIENTE}',\n`;
    sql += `  '${(result.cliente.Soggetto || '').replace(/'/g, "''")}',\n`;
    sql += `  'cliente',\n`;
    sql += `  '${result.cliente['P.IVA'] || ''}',\n`;
    sql += `  ${result.cliente.Email ? `'${result.cliente.Email}'` : 'NULL'},\n`;
    sql += `  ${result.cliente['Recapito Telefonico'] ? `'${result.cliente['Recapito Telefonico']}'` : 'NULL'},\n`;
    sql += `  ${result.cliente['Indirizzo 1'] ? `'${result.cliente['Indirizzo 1'].replace(/'/g, "''")}'` : 'NULL'},\n`;
    sql += `  NULL, -- comune_id da mappare\n`;
    sql += `  ${result.cliente.Provincia ? `'${result.cliente.Provincia}'` : 'NULL'},\n`;
    sql += `  ${result.cliente.Nazione ? `'${result.cliente.Nazione}'` : "'IT'"},\n`;
    sql += `  ${result.cliente.Agente ? `'${result.cliente.Agente}'` : 'NULL'},\n`;
    sql += `  ${result.cliente['Provvigione Agente (%)'] || 'NULL'},\n`;
    sql += `  NULL, -- listino_id da mappare\n`;
    sql += `  '${result.cliente.Valuta || 'EUR'}',\n`;
    sql += `  ${result.cliente['GG. Pagamento'] || 0}\n`;
    sql += `);\n\n`;
  }

  // SQL per FORNITORE
  if (result.fornitore) {
    sql += '-- FORNITORE\n';
    sql += `INSERT INTO soggetto (codice, ragione_sociale, tipo, partita_iva, nazione, valuta) VALUES (\n`;
    sql += `  '${result.fornitore.Cod || FORNITORE}',\n`;
    sql += `  '${(result.fornitore.Soggetto || '').replace(/'/g, "''")}',\n`;
    sql += `  'fornitore',\n`;
    sql += `  '${result.fornitore['P.IVA'] || ''}',\n`;
    sql += `  '${result.fornitore.Nazione || 'IT'}',\n`;
    sql += `  '${result.fornitore.Valuta || 'EUR'}'\n`;
    sql += `);\n\n`;
  }

  // SQL per ARTICOLO
  if (result.articolo) {
    sql += '-- ARTICOLO\n';
    sql += `INSERT INTO prodotto (codice, nome, brand_id, famiglia_id, unita_misura, prezzo_magazzino, pezzi_per_busta, buste_per_cartone, cartoni_per_pedana, lead_time_giorni, scorta_minima, fornitore_principale_id) VALUES (\n`;
    sql += `  '${result.articolo['Codice Articolo']}',\n`;
    sql += `  '${(result.articolo['Descrizione Articolo'] || '').replace(/'/g, "''")}',\n`;
    sql += `  NULL, -- brand_id da mappare\n`;
    sql += `  NULL, -- famiglia_id da mappare\n`;
    sql += `  '${result.articolo['Unità'] || 'PZ'}',\n`;
    sql += `  ${result.articolo['Prezzo a Magazzino'] || 0},\n`;
    sql += `  ${result.articolo['Pezzi in Busta'] || 'NULL'},\n`;
    sql += `  ${result.articolo['Buste in Cartone'] || 'NULL'},\n`;
    sql += `  ${result.articolo['Cartoni per Pedana'] || 'NULL'},\n`;
    sql += `  ${result.articolo['Lead Time'] || 'NULL'},\n`;
    sql += `  ${result.articolo['Scorta minima'] || 0},\n`;
    sql += `  NULL -- fornitore_principale_id da mappare con ${FORNITORE}\n`;
    sql += `);\n\n`;
  }

  fs.writeFileSync('test-data-insert.sql', sql, 'utf8');
  console.log('   ✅ SQL salvato in: test-data-insert.sql');

  // =====================================================
  // RIEPILOGO
  // =====================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RIEPILOGO ESTRAZIONE');
  console.log('='.repeat(80));
  console.log(`✅ Cliente ${CLIENTE}: ${result.cliente ? 'TROVATO' : 'NON TROVATO'}`);
  console.log(`✅ Fornitore ${FORNITORE}: ${result.fornitore ? 'TROVATO' : 'NON TROVATO'}`);
  console.log(`✅ Articolo ${ARTICOLO}: ${result.articolo ? 'TROVATO' : 'NON TROVATO'}`);
  console.log(`✅ Movimenti correlati: ${result.movimenti.length}`);
  console.log(`✅ Listini: ${result.listini ? 'TROVATI' : 'NON TROVATI'}`);
  console.log('\n✅ Estrazione completata con successo!');
  console.log('\n📁 File generati:');
  console.log('   - test-data-extracted.json (dati completi)');
  console.log('   - test-data-insert.sql (script SQL)');
  console.log('\n🎯 Prossimo passo: Eseguire lo script SQL per inserire i dati nel database');

} catch (error) {
  console.error('\n❌ Errore durante l\'estrazione:', error);
  process.exit(1);
}
