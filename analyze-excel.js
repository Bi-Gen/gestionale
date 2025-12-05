const XLSX = require('xlsx');
const fs = require('fs');

// Path del file Excel
const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

console.log('📊 ANALISI FILE EXCEL - ALL IN ONE GESTIONALE\n');
console.log('='.repeat(80));

try {
  // Leggi il file Excel
  const workbook = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true });

  console.log(`\n✅ File caricato con successo!\n`);
  console.log(`📋 FOGLI PRESENTI (${workbook.SheetNames.length} totali):\n`);

  workbook.SheetNames.forEach((sheetName, index) => {
    console.log(`${index + 1}. ${sheetName}`);
  });

  console.log('\n' + '='.repeat(80));

  // Analizza ogni foglio
  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    console.log(`\n\n📄 FOGLIO ${sheetIndex + 1}: "${sheetName}"`);
    console.log('-'.repeat(80));

    const worksheet = workbook.Sheets[sheetName];

    // Converti in JSON per analisi
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Info base
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const numRows = range.e.r + 1;
    const numCols = range.e.c + 1;

    console.log(`\n📊 Dimensioni: ${numRows} righe x ${numCols} colonne`);

    // Header (prima riga)
    if (jsonData.length > 0) {
      console.log(`\n🏷️  HEADER (Riga 1):`);
      const headers = jsonData[0];
      headers.forEach((header, idx) => {
        if (header) console.log(`   Col ${String.fromCharCode(65 + idx)}: ${header}`);
      });

      // Prime 5 righe di dati (escludendo header)
      if (jsonData.length > 1) {
        console.log(`\n📝 PRIME 5 RIGHE DI DATI:\n`);
        const dataRows = jsonData.slice(1, Math.min(6, jsonData.length));

        dataRows.forEach((row, rowIndex) => {
          console.log(`   Riga ${rowIndex + 2}:`);
          headers.forEach((header, colIndex) => {
            const value = row[colIndex];
            if (value !== '' && value !== null && value !== undefined) {
              console.log(`      ${header || 'Col ' + String.fromCharCode(65 + colIndex)}: ${value}`);
            }
          });
          console.log('');
        });
      }

      // Conta righe con dati (non vuote)
      const dataRowCount = jsonData.slice(1).filter(row =>
        row.some(cell => cell !== '' && cell !== null && cell !== undefined)
      ).length;
      console.log(`📈 Righe con dati: ${dataRowCount}`);

      // Cerca formule
      const formulas = [];
      for (let cell in worksheet) {
        if (cell[0] === '!') continue;
        if (worksheet[cell].f) {
          formulas.push({
            cell: cell,
            formula: worksheet[cell].f,
            value: worksheet[cell].v
          });
        }
      }

      if (formulas.length > 0) {
        console.log(`\n🧮 FORMULE TROVATE (${formulas.length} totali):`);
        formulas.slice(0, 10).forEach(f => {
          console.log(`   ${f.cell}: ${f.formula} = ${f.value}`);
        });
        if (formulas.length > 10) {
          console.log(`   ... e altre ${formulas.length - 10} formule`);
        }
      }

      // Cerca riferimenti ad altri fogli
      const sheetRefs = [];
      for (let cell in worksheet) {
        if (cell[0] === '!') continue;
        if (worksheet[cell].f) {
          const formula = worksheet[cell].f;
          // Cerca pattern come 'NomeFoglio'!A1
          const matches = formula.match(/'?([^'!]+)'?!/g);
          if (matches) {
            matches.forEach(match => {
              const refSheet = match.replace(/['!]/g, '');
              if (!sheetRefs.includes(refSheet)) {
                sheetRefs.push(refSheet);
              }
            });
          }
        }
      }

      if (sheetRefs.length > 0) {
        console.log(`\n🔗 RIFERIMENTI AD ALTRI FOGLI:`);
        sheetRefs.forEach(ref => {
          console.log(`   → ${ref}`);
        });
      }

    } else {
      console.log('\n⚠️  Foglio vuoto');
    }

    console.log('\n' + '-'.repeat(80));
  });

  // Riepilogo finale
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 RIEPILOGO ANALISI\n');

  const summary = workbook.SheetNames.map(name => {
    const ws = workbook.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    const dataRows = data.slice(1).filter(row =>
      row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    ).length;

    return {
      nome: name,
      righe: dataRows,
      colonne: data[0]?.length || 0
    };
  });

  summary.forEach((s, i) => {
    const tipo = s.righe > 100 ? '📦 TRANSAZIONI' :
                 s.righe > 10 ? '📋 ANAGRAFICA' :
                 '⚙️  CONFIGURAZIONE';
    console.log(`${i + 1}. ${s.nome.padEnd(30)} ${tipo.padEnd(20)} ${s.righe} righe, ${s.colonne} colonne`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('\n✅ Analisi completata!\n');

} catch (error) {
  console.error('❌ Errore durante la lettura del file:', error.message);
  process.exit(1);
}
