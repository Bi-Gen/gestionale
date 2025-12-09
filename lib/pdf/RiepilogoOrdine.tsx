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
    data_consegna_prevista?: string
  }
  cliente: {
    ragione_sociale: string
    partita_iva?: string
    codice_fiscale?: string
    codice_univoco?: string // SDI
    pec?: string
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
    incoterm?: string
    incoterm_nome?: string
    trasporto_a_carico?: string
  }
  pagamento?: {
    metodo?: string
    giorni_scadenza?: number
  }
  agente?: {
    ragione_sociale?: string
    codice_agente?: string
    telefono?: string
    email?: string
  }
}

export default function RiepilogoOrdine({ azienda, ordine, cliente, indirizzoSpedizione, dettagli, totali, trasporto, pagamento, agente }: Props) {
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
            {ordine.data_consegna_prevista && (
              <Text style={[commonStyles.documentDate, { marginTop: 5, color: '#059669' }]}>
                Consegna prevista: {new Date(ordine.data_consegna_prevista).toLocaleDateString('it-IT')}
              </Text>
            )}
          </View>
        </View>

        {/* Cliente e Spedizione */}
        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
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
            {cliente.codice_univoco && <Text style={commonStyles.companyInfo}>SDI: {cliente.codice_univoco}</Text>}
            {cliente.pec && <Text style={commonStyles.companyInfo}>PEC: {cliente.pec}</Text>}
            {cliente.email && !cliente.pec && <Text style={commonStyles.companyInfo}>Email: {cliente.email}</Text>}
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

        {/* Info Trasporto e Pagamento */}
        <View style={{ flexDirection: 'row', marginBottom: 15, backgroundColor: '#F9FAFB', padding: 10, borderRadius: 4 }}>
          {/* Trasporto */}
          <View style={{ width: '32%' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 5 }}>TRASPORTO</Text>
            {trasporto?.trasportatore && (
              <Text style={{ fontSize: 9, color: '#4B5563' }}>{trasporto.trasportatore}</Text>
            )}
            {trasporto?.incoterm && (
              <Text style={{ fontSize: 9, color: '#4B5563' }}>
                {trasporto.incoterm} {trasporto.incoterm_nome && `- ${trasporto.incoterm_nome}`}
              </Text>
            )}
            {trasporto?.trasporto_a_carico && (
              <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>
                ({trasporto.trasporto_a_carico === 'compratore' ? 'Franco fabbrica' : 'Franco destino'})
              </Text>
            )}
            {trasporto?.peso_totale !== undefined && trasporto.peso_totale > 0 && (
              <Text style={{ fontSize: 9, color: '#4B5563', marginTop: 2 }}>Peso: {trasporto.peso_totale.toFixed(2)} kg</Text>
            )}
          </View>

          {/* Pagamento */}
          <View style={{ width: '32%', marginLeft: '2%' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 5 }}>PAGAMENTO</Text>
            {pagamento?.metodo ? (
              <>
                <Text style={{ fontSize: 9, color: '#4B5563' }}>{pagamento.metodo}</Text>
                {pagamento.giorni_scadenza !== undefined && pagamento.giorni_scadenza > 0 && (
                  <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>
                    Scadenza: {pagamento.giorni_scadenza} giorni
                  </Text>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 9, color: '#9CA3AF' }}>Da definire</Text>
            )}
          </View>

          {/* Agente */}
          <View style={{ width: '32%', marginLeft: '2%' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 5 }}>AGENTE</Text>
            {agente?.ragione_sociale ? (
              <>
                <Text style={{ fontSize: 9, color: '#4B5563' }}>{agente.ragione_sociale}</Text>
                {agente.codice_agente && (
                  <Text style={{ fontSize: 8, color: '#6B7280', marginTop: 2 }}>Cod: {agente.codice_agente}</Text>
                )}
                {agente.telefono && (
                  <Text style={{ fontSize: 8, color: '#6B7280' }}>Tel: {agente.telefono}</Text>
                )}
              </>
            ) : (
              <Text style={{ fontSize: 9, color: '#9CA3AF' }}>-</Text>
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
              <Text style={[commonStyles.tableHeaderCell, { width: productTableWidths.quantita, textAlign: 'right' }]}>Qta</Text>
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
                  {item.prezzo_unitario.toFixed(2)}
                </Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.sconto, textAlign: 'right' }]}>
                  {item.sconto_percentuale > 0 ? `${item.sconto_percentuale}%` : '-'}
                </Text>
                <Text style={[commonStyles.tableCell, { width: productTableWidths.totale, textAlign: 'right' }]}>
                  {item.totale.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Totali */}
        <View style={commonStyles.totalsSection}>
          <View style={commonStyles.totalRow}>
            <Text style={commonStyles.totalLabel}>Imponibile:</Text>
            <Text style={commonStyles.totalValue}>EUR {totali.imponibile.toFixed(2)}</Text>
          </View>
          <View style={commonStyles.totalRow}>
            <Text style={commonStyles.totalLabel}>IVA (22%):</Text>
            <Text style={commonStyles.totalValue}>EUR {totali.iva.toFixed(2)}</Text>
          </View>
          {trasporto?.costo_stimato !== undefined && trasporto.costo_stimato > 0 && (
            <View style={commonStyles.totalRow}>
              <Text style={commonStyles.totalLabel}>Trasporto stimato:</Text>
              <Text style={commonStyles.totalValue}>EUR {trasporto.costo_stimato.toFixed(2)}</Text>
            </View>
          )}
          <View style={commonStyles.grandTotal}>
            <Text style={commonStyles.grandTotalLabel}>TOTALE:</Text>
            <Text style={commonStyles.grandTotalValue}>EUR {totali.totale.toFixed(2)}</Text>
          </View>
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
