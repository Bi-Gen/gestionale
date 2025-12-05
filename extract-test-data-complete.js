const XLSX = require('xlsx');
const fs = require('fs');

// Path del file Excel
const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

// Dati da estrarre
const CLIENTE = 'cl32';
const ARTICOLO = 'TLB451X1BL';
const FORNITORE = 'fo14';

console.log('🔍 ESTRAZIONE DATI TEST COMPLETI DA EXCEL\n');
console.log('='.repeat(80));
console.log(`\n📦 Dati da estrarre:`);
console.log(`   Cliente:    ${CLIENTE}`);
console.log(`   Articolo:   ${ARTICOLO}`);
console.log(`   Fornitore:  ${FORNITORE}`);
console.log('\n' + '='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n✅ File Excel caricato con successo!\n');

  const result = {
    cliente: null,
    fornitore: null,
    articolo: null,
    movimenti: [],
    listini: null
  };

  // =====================================================
  // 1. ESTRAI CLIENTE (cl32) da "Debitori - Creditori"
  // =====================================================
  console.log('📋 1. Estrazione CLIENTE...');

  const sheetDebitoriCreditori = workbook.Sheets['Debitori - Creditori'];
  if (sheetDebitoriCreditori) {
    const data = XLSX.utils.sheet_to_json(sheetDebitoriCreditori);
    const cliente = data.find(row => {
      const cod = row.Cod || row['Codice cliente'] || row['Cod. Cliente'];
      return cod && cod.toString().toLowerCase() === CLIENTE.toLowerCase();
    });

    if (cliente) {
      result.cliente = cliente;
      console.log('   ✅ Cliente trovato:');
      console.log(`      Codice: ${cliente.Cod || cliente['Codice cliente']}`);
      console.log(`      Nome: ${cliente.Soggetto || cliente['Ragione Sociale']}`);
      console.log(`      P.IVA: ${cliente['P.IVA'] || cliente['Partita Iva'] || 'N/A'}`);
      console.log(`      Nazione: ${cliente.Nazione || 'N/A'}`);
      console.log(`      Agente: ${cliente.Agente || 'N/A'}`);
      console.log(`      Listino: ${cliente['Listino di riferimento'] || 'N/A'}`);
      console.log(`      Tipo Pagamento: ${cliente['Tipo Pagamento'] || 'N/A'}`);
      console.log(`      GG Pagamento: ${cliente['GG. Pagamento'] || 0}`);
      console.log(`      Provvigione Agente: ${cliente['Provvigione Agente (%)'] || 0}%`);
    } else {
      console.log(`   ❌ Cliente ${CLIENTE} non trovato!`);
    }
  }

  // =====================================================
  // 2. ESTRAI FORNITORE (fo14) da "Debitori - Creditori"
  // =====================================================
  console.log('\n📋 2. Estrazione FORNITORE...');

  if (sheetDebitoriCreditori) {
    const data = XLSX.utils.sheet_to_json(sheetDebitoriCreditori);
    const fornitore = data.find(row => {
      const cod = row.Cod || row['Codice Fornitore'] || row['Cod. Fornitore'];
      return cod && cod.toString().toLowerCase() === FORNITORE.toLowerCase();
    });

    if (fornitore) {
      result.fornitore = fornitore;
      console.log('   ✅ Fornitore trovato:');
      console.log(`      Codice: ${fornitore.Cod || fornitore['Codice Fornitore']}`);
      console.log(`      Nome: ${fornitore.Soggetto || fornitore['Ragione Sociale']}`);
      console.log(`      P.IVA: ${fornitore['P.IVA'] || fornitore['Partita Iva'] || 'N/A'}`);
      console.log(`      Nazione: ${fornitore.Nazione || 'N/A'}`);
      console.log(`      Valuta: ${fornitore.Valuta || 'EUR'}`);
      console.log(`      Tipo Pagamento: ${fornitore['Tipo Pagamento'] || 'N/A'}`);
      console.log(`      GG Pagamento: ${fornitore['GG. Pagamento'] || 0}`);
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
    const articolo = data.find(row => {
      const cod = row['Codice Articolo'] || row['Codice'] || row['Cod. Articolo'];
      return cod && cod.toString().toUpperCase() === ARTICOLO.toUpperCase();
    });

    if (articolo) {
      result.articolo = articolo;
      console.log('   ✅ Articolo trovato:');
      console.log(`      Codice: ${articolo['Codice Articolo']}`);
      console.log(`      Nome: ${articolo['Descrizione Articolo'] || articolo.Nome}`);
      console.log(`      Brand: ${articolo.Brand || 'N/A'}`);
      console.log(`      Famiglia: ${articolo.Famiglia || 'N/A'}`);
      console.log(`      Macrofamiglia: ${articolo.Macrofamiglia || 'N/A'}`);
      console.log(`      Unità: ${articolo['Unità'] || articolo['Unità di misura']}`);
      console.log(`      Prezzo Magazzino: €${articolo['Prezzo a Magazzino'] || 0}`);
      console.log(`      Pezzi per Busta: ${articolo['Pezzi in Busta'] || 'N/A'}`);
      console.log(`      Buste per Cartone: ${articolo['Buste in Cartone'] || 'N/A'}`);
      console.log(`      Cartoni per Pedana: ${articolo['Cartoni per Pedana'] || 'N/A'}`);
      console.log(`      Lead Time: ${articolo['Lead Time'] || 'N/A'} giorni`);
      console.log(`      Scorta Minima: ${articolo['Scorta minima'] || 0}`);
      console.log(`      Fornitore Principale: ${articolo['Fornitore principale'] || 'N/A'}`);
    } else {
      console.log(`   ❌ Articolo ${ARTICOLO} non trovato in Anagrafica Articoli!`);
    }
  }

  // =====================================================
  // 4. ESTRAI TUTTI I MOVIMENTI da "DataBase Movimenti"
  // =====================================================
  console.log('\n📋 4. Estrazione MOVIMENTI correlati...');

  const sheetDatabaseMovimenti = workbook.Sheets['DataBase Movimenti'];
  if (sheetDatabaseMovimenti) {
    const data = XLSX.utils.sheet_to_json(sheetDatabaseMovimenti);

    // Filtra movimenti per il prodotto TLB451X1BL
    const movimenti = data.filter(row => {
      const prodotto = row['Prodotto'];
      return prodotto && prodotto.toString().toUpperCase() === ARTICOLO.toUpperCase();
    });

    result.movimenti = movimenti;
    console.log(`   ✅ Trovati ${movimenti.length} movimenti per articolo ${ARTICOLO}`);

    if (movimenti.length > 0) {
      // Conta vendite e acquisti
      const vendite = movimenti.filter(m =>
        m['Tipo movimento'] && m['Tipo movimento'].toString().toLowerCase() === 'scarico'
      );
      const acquisti = movimenti.filter(m =>
        m['Tipo movimento'] && m['Tipo movimento'].toString().toLowerCase() === 'carico'
      );

      console.log(`      - ${vendite.length} vendite (scarico)`);
      console.log(`      - ${acquisti.length} acquisti (carico)`);

      console.log('\n   📊 Riepilogo movimenti:');

      // Mostra vendite
      if (vendite.length > 0) {
        console.log(`\n      VENDITE (${vendite.length}):`);
        vendite.forEach((mov, idx) => {
          console.log(`\n         Vendita ${idx + 1}:`);
          console.log(`            Data: ${mov['Data movimento']}`);
          console.log(`            Causale: ${mov['Causale movimento']}`);
          console.log(`            Doc: ${mov['n° documento']}`);
          console.log(`            Cliente: ${mov['Soggetto']} (${mov['Cod']})`);
          console.log(`            Quantità: ${mov[' Quantità ']} ${mov['Unità']}`);
          console.log(`            Prezzo: €${mov['Prezzo Imponibile']}`);
          console.log(`            Imponibile: €${mov['Valore Imponibile']}`);
          console.log(`            Magazzino: ${mov['Magazzino'] || 'N/A'}`);
          console.log(`            Agente: ${mov['Agente'] || 'N/A'}`);
          console.log(`            Provv. Agente: ${mov['Provvigione Agente (%)'] || 0}% = €${mov['Provvigione Agente (Valore)'] || 0}`);
        });
      }

      // Mostra acquisti
      if (acquisti.length > 0) {
        console.log(`\n      ACQUISTI (${acquisti.length}):`);
        acquisti.forEach((mov, idx) => {
          console.log(`\n         Acquisto ${idx + 1}:`);
          console.log(`            Data: ${mov['Data movimento']}`);
          console.log(`            Causale: ${mov['Causale movimento']}`);
          console.log(`            Doc: ${mov['n° documento']}`);
          console.log(`            Fornitore: ${mov['Soggetto']} (${mov['Cod']})`);
          console.log(`            Quantità: ${mov[' Quantità ']} ${mov['Unità']}`);
          console.log(`            Prezzo: €${mov['Prezzo Imponibile']}`);
          console.log(`            Imponibile: €${mov['Valore Imponibile']}`);
          console.log(`            Magazzino: ${mov['Magazzino'] || 'N/A'}`);
          console.log(`            ETD: ${mov['ETD (Carry Out)'] || 'N/A'}`);
        });
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
    const listino = data.find(row => {
      const cod = row['Cod. Prodotto'] || row['Codice Prodotto'];
      return cod && cod.toString().toUpperCase() === ARTICOLO.toUpperCase();
    });

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

  const outputFile = 'test-data-complete.json';
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
  console.log(`   ✅ Dati salvati in: ${outputFile}`);

  // =====================================================
  // RIEPILOGO
  // =====================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RIEPILOGO ESTRAZIONE');
  console.log('='.repeat(80));
  console.log(`Cliente ${CLIENTE}: ${result.cliente ? '✅ TROVATO' : '❌ NON TROVATO'}`);
  if (result.cliente) {
    console.log(`   → ${result.cliente.Soggetto || result.cliente['Ragione Sociale']}`);
  }
  console.log(`Fornitore ${FORNITORE}: ${result.fornitore ? '✅ TROVATO' : '❌ NON TROVATO'}`);
  if (result.fornitore) {
    console.log(`   → ${result.fornitore.Soggetto || result.fornitore['Ragione Sociale']}`);
  }
  console.log(`Articolo ${ARTICOLO}: ${result.articolo ? '✅ TROVATO' : '❌ NON TROVATO'}`);
  if (result.articolo) {
    console.log(`   → ${result.articolo['Descrizione Articolo'] || result.articolo.Nome}`);
  }
  console.log(`Movimenti: ${result.movimenti.length} trovati`);
  if (result.movimenti.length > 0) {
    const vendite = result.movimenti.filter(m =>
      m['Tipo movimento'] && m['Tipo movimento'].toString().toLowerCase() === 'scarico'
    ).length;
    const acquisti = result.movimenti.filter(m =>
      m['Tipo movimento'] && m['Tipo movimento'].toString().toLowerCase() === 'carico'
    ).length;
    console.log(`   → ${vendite} vendite, ${acquisti} acquisti`);
  }
  console.log(`Listini: ${result.listini ? '✅ TROVATI' : '❌ NON TROVATI'}`);

  console.log('\n✅ Estrazione completata con successo!');
  console.log('\n📁 File generato:');
  console.log(`   - ${outputFile} (dati completi in JSON)`);
  console.log('\n🎯 Prossimo passo: Generare SQL di inserimento per importare questi dati');

} catch (error) {
  console.error('\n❌ Errore durante l\'estrazione:', error);
  process.exit(1);
}
