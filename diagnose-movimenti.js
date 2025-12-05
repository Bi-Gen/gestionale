const XLSX = require('xlsx');

// Path del file Excel
const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

console.log('🔍 DIAGNOSTICA FOGLIO DATABASE MOVIMENTI\n');
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n✅ File Excel caricato con successo!\n');

  const sheetDatabaseMovimenti = workbook.Sheets['DataBase Movimenti'];

  if (!sheetDatabaseMovimenti) {
    console.log('❌ Foglio "DataBase Movimenti" non trovato!');
    console.log('Fogli disponibili:', workbook.SheetNames);
    process.exit(1);
  }

  const data = XLSX.utils.sheet_to_json(sheetDatabaseMovimenti);
  console.log(`📊 Totale righe nel foglio: ${data.length}`);

  // 1. Mostra tutti i nomi delle colonne dalla prima riga
  console.log('\n📋 COLONNE DISPONIBILI NEL FOGLIO:');
  console.log('='.repeat(80));
  if (data.length > 0) {
    const columns = Object.keys(data[0]);
    columns.forEach((col, idx) => {
      console.log(`   ${idx + 1}. "${col}"`);
    });
  }

  // 2. Cerca righe contenenti "TLB451" in qualsiasi campo
  console.log('\n\n🔎 RICERCA RIGHE CONTENENTI "TLB451":');
  console.log('='.repeat(80));

  const righeConTLB = data.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return value.toString().toUpperCase().includes('TLB451');
    });
  });

  console.log(`\n✅ Trovate ${righeConTLB.length} righe contenenti "TLB451"\n`);

  if (righeConTLB.length > 0) {
    // Mostra in dettaglio le prime 5 righe
    righeConTLB.slice(0, Math.min(5, righeConTLB.length)).forEach((row, idx) => {
      console.log(`\n--- RIGA ${idx + 1} ---`);

      // Mostra solo i campi più rilevanti per il debug
      const campiRilevanti = [
        'Data movimento',
        'Causale movimento',
        'n° documento',
        'Cod',
        'Cod. Soggetto',
        'Soggetto',
        'Prodotto',
        'Codice Prodotto',
        'Cod. Prodotto',
        'Cod Prodotto',
        'Descrizione Articolo',
        'Quantità',
        'Unità di Vendita',
        'Prezzo Imponibile',
        'Valore Imponibile'
      ];

      campiRilevanti.forEach(campo => {
        if (row[campo] !== undefined) {
          console.log(`   ${campo}: ${row[campo]}`);
        }
      });

      // Se nessun campo rilevante è stato trovato, mostra tutti i campi
      const hasCampiRilevanti = campiRilevanti.some(c => row[c] !== undefined);
      if (!hasCampiRilevanti) {
        console.log('   TUTTI I CAMPI:');
        Object.keys(row).forEach(key => {
          console.log(`   ${key}: ${row[key]}`);
        });
      }
    });

    if (righeConTLB.length > 5) {
      console.log(`\n... e altre ${righeConTLB.length - 5} righe`);
    }

    // 3. Analizza quali colonne contengono il codice TLB451X1BL
    console.log('\n\n📊 ANALISI COLONNE CONTENENTI "TLB451X1BL":');
    console.log('='.repeat(80));

    const colonneConCodice = {};
    righeConTLB.forEach(row => {
      Object.keys(row).forEach(col => {
        if (row[col] && row[col].toString().toUpperCase().includes('TLB451X1BL')) {
          colonneConCodice[col] = (colonneConCodice[col] || 0) + 1;
        }
      });
    });

    Object.entries(colonneConCodice).forEach(([col, count]) => {
      console.log(`   "${col}": ${count} occorrenze`);
    });
  }

  // 4. Cerca righe con Fornitore Fo14
  console.log('\n\n🔎 RICERCA RIGHE CON FORNITORE "Fo14":');
  console.log('='.repeat(80));

  const righeFo14 = data.filter(row => {
    const cod = row['Cod'] || row['Cod. Soggetto'] || row['Codice Soggetto'];
    return cod && cod.toString().toUpperCase() === 'FO14';
  });

  console.log(`\n✅ Trovate ${righeFo14.length} righe con Fornitore Fo14`);

  if (righeFo14.length > 0) {
    // Mostra codici prodotto unici per Fo14
    const prodottiUnichi = [...new Set(righeFo14.map(r => {
      return r['Prodotto'] || r['Codice Prodotto'] || r['Cod. Prodotto'] || r['Cod Prodotto'] || 'N/A';
    }))];

    console.log('\n📦 Codici prodotto per Fo14:');
    prodottiUnichi.slice(0, 20).forEach(p => {
      const count = righeFo14.filter(r => {
        const prod = r['Prodotto'] || r['Codice Prodotto'] || r['Cod. Prodotto'] || r['Cod Prodotto'];
        return prod === p;
      }).length;
      console.log(`   ${p}: ${count} movimenti`);
    });
  }

  // 5. Cerca righe con Cliente Cl32
  console.log('\n\n🔎 RICERCA RIGHE CON CLIENTE "Cl32":');
  console.log('='.repeat(80));

  const righeCl32 = data.filter(row => {
    const cod = row['Cod'] || row['Cod. Soggetto'] || row['Codice Soggetto'];
    return cod && cod.toString().toUpperCase() === 'CL32';
  });

  console.log(`\n✅ Trovate ${righeCl32.length} righe con Cliente Cl32`);

  // 6. CRUCIALE: Cerca la combinazione TLB451X1BL in tutte le righe
  console.log('\n\n🎯 RICERCA ESATTA "TLB451X1BL":');
  console.log('='.repeat(80));

  const rigeEsatte = data.filter(row => {
    return Object.values(row).some(value => {
      if (value === null || value === undefined) return false;
      return value.toString().toUpperCase() === 'TLB451X1BL';
    });
  });

  console.log(`\n✅ Trovate ${rigeEsatte.length} righe con codice ESATTO "TLB451X1BL"`);

  if (rigeEsatte.length > 0) {
    console.log('\n📄 DETTAGLIO COMPLETO TUTTE LE RIGHE CON TLB451X1BL:');
    rigeEsatte.forEach((row, idx) => {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`RIGA ${idx + 1} di ${rigeEsatte.length}`);
      console.log('='.repeat(80));
      Object.keys(row).forEach(key => {
        console.log(`${key}: ${row[key]}`);
      });
    });
  }

  console.log('\n\n✅ Diagnostica completata!');

} catch (error) {
  console.error('\n❌ Errore durante la diagnostica:', error);
  process.exit(1);
}
