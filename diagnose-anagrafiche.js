const XLSX = require('xlsx');

const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

const CLIENTE = 'cl32';
const ARTICOLO = 'TLB451X1BL';
const FORNITORE = 'fo14';

console.log('🔍 DIAGNOSTICA FOGLI ANAGRAFICHE\n');
console.log('='.repeat(80));

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n✅ File Excel caricato con successo!\n');
  console.log('📋 Fogli disponibili nel file:');
  workbook.SheetNames.forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`);
  });

  // =====================================================
  // 1. CERCA IN "Debitori - Creditori"
  // =====================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 ANALISI FOGLIO "Debitori - Creditori"');
  console.log('='.repeat(80));

  const sheetDebitoriCreditori = workbook.Sheets['Debitori - Creditori'];
  if (sheetDebitoriCreditori) {
    const data = XLSX.utils.sheet_to_json(sheetDebitoriCreditori);
    console.log(`\n✅ Foglio trovato con ${data.length} righe`);

    // Mostra colonne
    if (data.length > 0) {
      console.log('\n📋 Colonne disponibili:');
      Object.keys(data[0]).forEach((col, idx) => {
        console.log(`   ${idx + 1}. "${col}"`);
      });

      // Cerca tutte le righe che contengono cl32 o fo14
      console.log('\n\n🔎 Ricerca cl32 e fo14 (case-insensitive in TUTTE le colonne):');

      const righeTrovate = data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          const str = value.toString().toLowerCase();
          return str.includes('cl32') || str.includes('fo14');
        });
      });

      console.log(`\n✅ Trovate ${righeTrovate.length} righe contenenti cl32 o fo14`);

      if (righeTrovate.length > 0) {
        righeTrovate.forEach((row, idx) => {
          console.log(`\n--- RIGA ${idx + 1} ---`);
          Object.keys(row).forEach(key => {
            const value = row[key];
            if (value !== null && value !== undefined && value !== '') {
              console.log(`   ${key}: ${value}`);
            }
          });
        });
      } else {
        console.log('\n⚠️  Nessuna riga trovata. Mostro le prime 3 righe come esempio:');
        data.slice(0, 3).forEach((row, idx) => {
          console.log(`\n--- ESEMPIO RIGA ${idx + 1} ---`);
          Object.keys(row).forEach(key => {
            const value = row[key];
            if (value !== null && value !== undefined && value !== '') {
              console.log(`   ${key}: ${value}`);
            }
          });
        });
      }
    }
  } else {
    console.log('❌ Foglio "Debitori - Creditori" non trovato!');
  }

  // =====================================================
  // 2. CERCA IN "Anagrafica Articoli"
  // =====================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 ANALISI FOGLIO "Anagrafica Articoli"');
  console.log('='.repeat(80));

  const sheetAnagraficaArticoli = workbook.Sheets['Anagrafica Articoli'];
  if (sheetAnagraficaArticoli) {
    const data = XLSX.utils.sheet_to_json(sheetAnagraficaArticoli);
    console.log(`\n✅ Foglio trovato con ${data.length} righe`);

    // Mostra colonne
    if (data.length > 0) {
      console.log('\n📋 Colonne disponibili:');
      Object.keys(data[0]).forEach((col, idx) => {
        console.log(`   ${idx + 1}. "${col}"`);
      });

      // Cerca TLB451X1BL
      console.log('\n\n🔎 Ricerca TLB451X1BL (case-insensitive in TUTTE le colonne):');

      const righeTrovate = data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          const str = value.toString().toUpperCase();
          return str.includes('TLB451X1BL') || str.includes('TLB451');
        });
      });

      console.log(`\n✅ Trovate ${righeTrovate.length} righe contenenti TLB451`);

      if (righeTrovate.length > 0) {
        righeTrovate.forEach((row, idx) => {
          console.log(`\n--- RIGA ${idx + 1} ---`);
          Object.keys(row).forEach(key => {
            const value = row[key];
            if (value !== null && value !== undefined && value !== '') {
              console.log(`   ${key}: ${value}`);
            }
          });
        });
      } else {
        console.log('\n⚠️  Nessuna riga trovata. Mostro le prime 3 righe come esempio:');
        data.slice(0, 3).forEach((row, idx) => {
          console.log(`\n--- ESEMPIO RIGA ${idx + 1} ---`);
          Object.keys(row).forEach(key => {
            const value = row[key];
            if (value !== null && value !== undefined && value !== '') {
              console.log(`   ${key}: ${value}`);
            }
          });
        });

        // Mostra tutti i codici articolo unici per capire il pattern
        console.log('\n📦 Primi 20 codici articolo trovati nel foglio:');
        const codici = data
          .map(r => r['Codice Articolo'] || r['Codice'] || r['Cod. Articolo'])
          .filter(c => c !== null && c !== undefined)
          .slice(0, 20);
        codici.forEach((cod, idx) => {
          console.log(`   ${idx + 1}. ${cod}`);
        });
      }
    }
  } else {
    console.log('❌ Foglio "Anagrafica Articoli" non trovato!');
  }

  // =====================================================
  // 3. CERCA IN "Listini"
  // =====================================================
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 ANALISI FOGLIO "Listini"');
  console.log('='.repeat(80));

  const sheetListini = workbook.Sheets['Listini'];
  if (sheetListini) {
    const data = XLSX.utils.sheet_to_json(sheetListini);
    console.log(`\n✅ Foglio trovato con ${data.length} righe`);

    // Cerca TLB451X1BL
    const righeTrovate = data.filter(row => {
      return Object.values(row).some(value => {
        if (value === null || value === undefined) return false;
        const str = value.toString().toUpperCase();
        return str.includes('TLB451X1BL') || str.includes('TLB451');
      });
    });

    console.log(`\n🔎 Trovate ${righeTrovate.length} righe contenenti TLB451`);

    if (righeTrovate.length > 0) {
      console.log('\n--- DETTAGLIO LISTINI ---');
      righeTrovate.forEach((row, idx) => {
        console.log(`\nProdotto ${idx + 1}:`);
        Object.keys(row).forEach(key => {
          const value = row[key];
          if (value !== null && value !== undefined && value !== '') {
            console.log(`   ${key}: ${value}`);
          }
        });
      });
    }
  }

  console.log('\n\n✅ Diagnostica completata!');

} catch (error) {
  console.error('\n❌ Errore durante la diagnostica:', error);
  process.exit(1);
}
