import { Document, Page, View, Text } from '@react-pdf/renderer'
import { commonStyles, productTableWidths } from './styles'

type Props = {
  azienda: {
    nome: string
    ragione_sociale?: string
    partita_iva?: string
    codice_fiscale?: string
    email: string
    telefono?: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  proforma: {
    numero_proforma: string
    numero_fattura?: string // Campo editabile per numero fattura
    data: string
    numero_ordine?: string
    scadenza_pagamento?: string
  }
  cliente: {
    ragione_sociale: string
    partita_iva?: string
    codice_fiscale?: string
    email?: string
    telefono?: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  dettagli: Array<{
    codice: string
    descrizione: string
    quantita: number
    unita: string
    prezzo_unitario: number
    sconto_percentuale: number
    totale: number
  }>
  totali: {
    imponibile: number
    iva: number
    totale: number
  }
  pagamento?: {
    metodo?: string
    iban?: string
    banca?: string
  }
  note?: string
}

export default function Proforma({ azienda, proforma, cliente, dettagli, totali, pagamento, note }: Props) {
  return (
    <Document>
      <Page size="A4" style={commonStyles.page}>
        {/* Header */}
        <View style={commonStyles.header}>
          <View style={commonStyles.headerLeft}>
            <Text style={commonStyles.companyName}>{azienda.ragione_sociale || azienda.nome}</Text>
            {azienda.indirizzo && (
              <Text style={commonStyles.companyInfo}>
                {azienda.indirizzo}, {azienda.cap} {azienda.citta} {azienda.provincia && `(${azienda.provincia})`}
              </Text>
            )}
            {azienda.partita_iva && <Text style={commonStyles.companyInfo}>P.IVA: {azienda.partita_iva}</Text>}
            {azienda.codice_fiscale && <Text style={commonStyles.companyInfo}>C.F.: {azienda.codice_fiscale}</Text>}
            {azienda.telefono && <Text style={commonStyles.companyInfo}>Tel: {azienda.telefono}</Text>}
            <Text style={commonStyles.companyInfo}>Email: {azienda.email}</Text>
          </View>
          <View style={commonStyles.headerRight}>
            <Text style={commonStyles.documentTitle}>FATTURA PROFORMA</Text>
            <Text style={commonStyles.documentNumber}>N. {proforma.numero_proforma}</Text>
            <Text style={commonStyles.documentDate}>Data: {new Date(proforma.data).toLocaleDateString('it-IT')}</Text>
            {proforma.numero_fattura && (
              <View style={{ marginTop: 10, padding: 5, backgroundColor: '#FEF3C7', borderRadius: 3 }}>
                <Text style={{ fontSize: 8, color: '#92400E' }}>Numero Fattura:</Text>
                <Text style={{ fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#92400E' }}>{proforma.numero_fattura}</Text>
              </View>
            )}
            {proforma.numero_ordine && (
              <Text style={[commonStyles.documentDate, { marginTop: 5 }]}>Rif. Ordine: {proforma.numero_ordine}</Text>
            )}
          </View>
        </View>

        {/* Cliente */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>INTESTATARIO FATTURA</Text>
          <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{cliente.ragione_sociale}</Text>
          {cliente.indirizzo && (
            <Text style={commonStyles.companyInfo}>
              {cliente.indirizzo}, {cliente.cap} {cliente.citta} {cliente.provincia && `(${cliente.provincia})`}
            </Text>
          )}
          {cliente.partita_iva && <Text style={commonStyles.companyInfo}>P.IVA: {cliente.partita_iva}</Text>}
          {cliente.codice_fiscale && <Text style={commonStyles.companyInfo}>C.F.: {cliente.codice_fiscale}</Text>}
          {cliente.email && <Text style={commonStyles.companyInfo}>Email: {cliente.email}</Text>}
        </View>

        {/* Tabella Prodotti */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>DETTAGLIO</Text>
          <View style={commonStyles.table}>
            {/* Header */}
            <View style={commonStyles.tableHeader}>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.codice }]}>Codice</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.descrizione }]}>Descrizione</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.quantita, textAlign: 'right' }]}>Qtà</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.prezzo, textAlign: 'right' }]}>Prezzo</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.sconto, textAlign: 'right' }]}>Sconto</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.totale, textAlign: 'right' }]}>Totale</Text>
            </View>

            {/* Rows */}
            {dettagli.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? commonStyles.tableRow : commonStyles.tableRowAlt}>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.codice }]}>{item.codice}</Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.descrizione }]}>{item.descrizione}</Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.quantita, textAlign: 'right' }]}>
                  {item.quantita} {item.unita}
                </Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.prezzo, textAlign: 'right' }]}>
                  € {item.prezzo_unitario.toFixed(2)}
                </Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.sconto, textAlign: 'right' }]}>
                  {item.sconto_percentuale > 0 ? `${item.sconto_percentuale}%` : '-'}
                </Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.totale, textAlign: 'right' }]}>
                  € {item.totale.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totali */}
        <View style={commonStyles.totalsSection}>
          <View style={commonStyles.totalRow}>
            <Text style={commonStyles.totalLabel}>Imponibile:</Text>
            <Text style={commonStyles.totalValue}>€ {totali.imponibile.toFixed(2)}</Text>
          </View>
          <View style={commonStyles.totalRow}>
            <Text style={commonStyles.totalLabel}>IVA (22%):</Text>
            <Text style={commonStyles.totalValue}>€ {totali.iva.toFixed(2)}</Text>
          </View>
          <View style={commonStyles.grandTotal}>
            <Text style={commonStyles.grandTotalLabel}>TOTALE:</Text>
            <Text style={commonStyles.grandTotalValue}>€ {totali.totale.toFixed(2)}</Text>
          </View>
        </View>

        {/* Dati Pagamento */}
        {pagamento && (pagamento.metodo || pagamento.iban) && (
          <View style={commonStyles.section}>
            <Text style={commonStyles.sectionTitle}>MODALITA DI PAGAMENTO</Text>
            {pagamento.metodo && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Metodo:</Text>
                <Text style={commonStyles.value}>{pagamento.metodo}</Text>
              </View>
            )}
            {proforma.scadenza_pagamento && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Scadenza:</Text>
                <Text style={commonStyles.value}>{new Date(proforma.scadenza_pagamento).toLocaleDateString('it-IT')}</Text>
              </View>
            )}
            {pagamento.iban && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>IBAN:</Text>
                <Text style={commonStyles.value}>{pagamento.iban}</Text>
              </View>
            )}
            {pagamento.banca && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Banca:</Text>
                <Text style={commonStyles.value}>{pagamento.banca}</Text>
              </View>
            )}
          </View>
        )}

        {/* Note */}
        {note && (
          <View style={commonStyles.notes}>
            <Text style={commonStyles.notesTitle}>NOTE:</Text>
            <Text style={commonStyles.notesText}>{note}</Text>
          </View>
        )}

        {/* Avviso Proforma */}
        <View style={{ marginTop: 20, padding: 10, backgroundColor: '#FEF3C7', borderRadius: 4 }}>
          <Text style={{ fontSize: 9, color: '#92400E', textAlign: 'center' }}>
            DOCUMENTO NON VALIDO AI FINI FISCALI - FATTURA PROFORMA
          </Text>
          <Text style={{ fontSize: 8, color: '#92400E', textAlign: 'center', marginTop: 3 }}>
            Il presente documento ha valore di conferma ordine. La fattura definitiva sara emessa al momento della spedizione.
          </Text>
        </View>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Text style={commonStyles.footerText}>
            Documento generato il {new Date().toLocaleDateString('it-IT')} - {azienda.ragione_sociale || azienda.nome}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
