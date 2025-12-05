const XLSX = require('xlsx');

// Path del file Excel
const filePath = 'C:\\Users\\loren\\file per gestionale\\Gestionale G Group collegato BI.xlsx';

console.log('📊 ANALISI DETTAGLIATA EXCEL - ALL IN ONE GESTIONALE\n');
console.log('='.repeat(100));

try {
  const workbook = XLSX.readFile(filePath, { cellFormula: true, cellStyles: true });

  console.log(`\n✅ File caricato: ${workbook.SheetNames.length} fogli totali\n`);

  const analysis = [];

  // Analizza ogni foglio
  workbook.SheetNames.forEach((sheetName, index) => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Conta righe con dati
    const dataRows = jsonData.slice(1).filter(row =>
      row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    ).length;

    // Headers
    const headers = jsonData[0] || [];
    const numCols = headers.filter(h => h && String(h).trim() !== '').length;

    // Conta formule
    let formulaCount = 0;
    const referencedSheets = new Set();

    for (let cell in worksheet) {
      if (cell[0] === '!') continue;
      if (worksheet[cell].f) {
        formulaCount++;
        // Cerca riferimenti ad altri fogli
        const formula = worksheet[cell].f;
        const matches = formula.match(/'?([^'!\[\]]+)'?!/g);
        if (matches) {
          matches.forEach(match => {
            const refSheet = match.replace(/['!]/g, '').trim();
            if (refSheet && refSheet !== sheetName) {
              referencedSheets.add(refSheet);
            }
          });
        }
      }
    }

    // Classifica il tipo di foglio
    let tipo = '⚙️  CONFIG/UTIL';
    if (dataRows > 1000) tipo = '📦 TRANSAZIONI';
    else if (dataRows > 100 && dataRows <= 1000) tipo = '📋 ANAGRAFICA';
    else if (dataRows > 10 && dataRows <= 100) tipo = '📄 REPORT/FORM';
    else if (dataRows <= 10) tipo = '⚙️  CONFIG/UTIL';

    analysis.push({
      index: index + 1,
      nome: sheetName,
      tipo,
      righe: dataRows,
      colonne: numCols,
      formule: formulaCount,
      riferimenti: Array.from(referencedSheets),
      headers: headers.filter(h => h && String(h).trim() !== '').slice(0, 20) // prime 20 colonne
    });
  });

  // Stampa riepilogo
  console.log('\n📊 RIEPILOGO FOGLI:\n');
  console.log('-'.repeat(100));
  analysis.forEach(a => {
    console.log(`${String(a.index).padStart(2)}. ${a.nome.padEnd(35)} ${a.tipo.padEnd(20)} ${String(a.righe).padStart(5)} righe  ${String(a.colonne).padStart(3)} col  ${String(a.formule).padStart(7)} formule`);
  });
  console.log('-'.repeat(100));

  // Raggruppa per tipo
  console.log('\n\n📑 RAGGRUPPAMENTO PER TIPO:\n');

  const transazioni = analysis.filter(a => a.tipo === '📦 TRANSAZIONI');
  const anagrafiche = analysis.filter(a => a.tipo === '📋 ANAGRAFICA');
  const report = analysis.filter(a => a.tipo === '📄 REPORT/FORM');
  const config = analysis.filter(a => a.tipo === '⚙️  CONFIG/UTIL');

  console.log(`📦 TRANSAZIONI (${transazioni.length}):`);
  transazioni.forEach(a => console.log(`   - ${a.nome} (${a.righe} righe, ${a.colonne} colonne)`));

  console.log(`\n📋 ANAGRAFICHE (${anagrafiche.length}):`);
  anagrafiche.forEach(a => console.log(`   - ${a.nome} (${a.righe} righe, ${a.colonne} colonne)`));

  console.log(`\n📄 REPORT/FORM (${report.length}):`);
  report.forEach(a => console.log(`   - ${a.nome} (${a.righe} righe, ${a.colonne} colonne)`));

  console.log(`\n⚙️  CONFIGURAZIONI/UTILITY (${config.length}):`);
  config.forEach(a => console.log(`   - ${a.nome} (${a.righe} righe, ${a.colonne} colonne)`));

  // Analizza relazioni tra fogli
  console.log('\n\n🔗 RELAZIONI TRA FOGLI:\n');
  analysis.forEach(a => {
    if (a.riferimenti.length > 0) {
      console.log(`${a.nome}:`);
      a.riferimenti.forEach(ref => {
        console.log(`   → dipende da: ${ref}`);
      });
    }
  });

  // Dettagli colonne per fogli principali
  console.log('\n\n📋 DETTAGLIO COLONNE FOGLI PRINCIPALI:\n');
  console.log('='.repeat(100));

  analysis.filter(a => a.tipo === '📦 TRANSAZIONI' || a.tipo === '📋 ANAGRAFICA').forEach(a => {
    console.log(`\n${a.nome} (${a.righe} righe x ${a.colonne} colonne):`);
    console.log('-'.repeat(100));
    if (a.headers.length > 0) {
      a.headers.forEach((h, i) => {
        if (h) console.log(`   ${String(i + 1).padStart(3)}. ${h}`);
      });
    } else {
      console.log('   (nessun header)');
    }
  });

  console.log('\n\n' + '='.repeat(100));
  console.log('✅ Analisi completata!\n');

} catch (error) {
  console.error('❌ Errore:', error.message);
  process.exit(1);
}
