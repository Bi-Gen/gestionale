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
  ordine: {
    numero_ordine: string
    data_ordine: string
    stato: string
    note?: string
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
  indirizzoSpedizione?: {
    denominazione: string
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
  trasporto?: {
    trasportatore?: string
    costo_stimato?: number
    peso_totale?: number
  }
  pagamento?: {
    metodo?: string
    giorni_scadenza?: number
  }
}

export default function RiepilogoOrdine({ azienda, ordine, cliente, indirizzoSpedizione, dettagli, totali, trasporto, pagamento }: Props) {
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
            {azienda.telefono && <Text style={commonStyles.companyInfo}>Tel: {azienda.telefono}</Text>}
            <Text style={commonStyles.companyInfo}>Email: {azienda.email}</Text>
          </View>
          <View style={commonStyles.headerRight}>
            <Text style={commonStyles.documentTitle}>RIEPILOGO ORDINE</Text>
            <Text style={commonStyles.documentNumber}>N. {ordine.numero_ordine}</Text>
            <Text style={commonStyles.documentDate}>Data: {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}</Text>
          </View>
        </View>

        {/* Cliente e Spedizione */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          {/* Cliente */}
          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>CLIENTE</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{cliente.ragione_sociale}</Text>
            {cliente.indirizzo && (
              <Text style={commonStyles.companyInfo}>
                {cliente.indirizzo}, {cliente.cap} {cliente.citta} {cliente.provincia && `(${cliente.provincia})`}
              </Text>
            )}
            {cliente.partita_iva && <Text style={commonStyles.companyInfo}>P.IVA: {cliente.partita_iva}</Text>}
            {cliente.codice_fiscale && <Text style={commonStyles.companyInfo}>C.F.: {cliente.codice_fiscale}</Text>}
            {cliente.email && <Text style={commonStyles.companyInfo}>Email: {cliente.email}</Text>}
            {cliente.telefono && <Text style={commonStyles.companyInfo}>Tel: {cliente.telefono}</Text>}
          </View>

          {/* Spedizione */}
          <View style={{ width: '4%' }} />
          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>INDIRIZZO DI SPEDIZIONE</Text>
            {indirizzoSpedizione ? (
              <>
                <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{indirizzoSpedizione.denominazione}</Text>
                <Text style={commonStyles.companyInfo}>
                  {indirizzoSpedizione.indirizzo}, {indirizzoSpedizione.cap} {indirizzoSpedizione.citta} {indirizzoSpedizione.provincia && `(${indirizzoSpedizione.provincia})`}
                </Text>
              </>
            ) : (
              <>
                <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5 }}>{cliente.ragione_sociale}</Text>
                <Text style={commonStyles.companyInfo}>
                  {cliente.indirizzo}, {cliente.cap} {cliente.citta} {cliente.provincia && `(${cliente.provincia})`}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Tabella Prodotti */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>DETTAGLIO ORDINE</Text>
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
          {trasporto?.costo_stimato && trasporto.costo_stimato > 0 && (
            <View style={commonStyles.totalRow}>
              <Text style={commonStyles.totalLabel}>Trasporto stimato:</Text>
              <Text style={commonStyles.totalValue}>€ {trasporto.costo_stimato.toFixed(2)}</Text>
            </View>
          )}
          <View style={commonStyles.grandTotal}>
            <Text style={commonStyles.grandTotalLabel}>TOTALE:</Text>
            <Text style={commonStyles.grandTotalValue}>€ {totali.totale.toFixed(2)}</Text>
          </View>
        </View>

        {/* Info Trasporto e Pagamento */}
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          {trasporto?.trasportatore && (
            <View style={{ width: '48%' }}>
              <Text style={commonStyles.sectionTitle}>TRASPORTO</Text>
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Trasportatore:</Text>
                <Text style={commonStyles.value}>{trasporto.trasportatore}</Text>
              </View>
              {trasporto.peso_totale !== undefined && (
                <View style={commonStyles.row}>
                  <Text style={commonStyles.label}>Peso totale:</Text>
                  <Text style={commonStyles.value}>{trasporto.peso_totale.toFixed(2)} kg</Text>
                </View>
              )}
            </View>
          )}
          {pagamento?.metodo && (
            <View style={{ width: trasporto?.trasportatore ? '48%' : '100%', marginLeft: trasporto?.trasportatore ? '4%' : 0 }}>
              <Text style={commonStyles.sectionTitle}>PAGAMENTO</Text>
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Metodo:</Text>
                <Text style={commonStyles.value}>{pagamento.metodo}</Text>
              </View>
              {pagamento.giorni_scadenza !== undefined && pagamento.giorni_scadenza > 0 && (
                <View style={commonStyles.row}>
                  <Text style={commonStyles.label}>Scadenza:</Text>
                  <Text style={commonStyles.value}>{pagamento.giorni_scadenza} giorni</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Note */}
        {ordine.note && (
          <View style={commonStyles.notes}>
            <Text style={commonStyles.notesTitle}>NOTE:</Text>
            <Text style={commonStyles.notesText}>{ordine.note}</Text>
          </View>
        )}

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
