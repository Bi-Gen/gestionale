import { Document, Page, View, Text } from '@react-pdf/renderer'
import { commonStyles, ddtTableWidths } from './styles'

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
  ddt: {
    numero: string
    data: string
    numero_ordine?: string
    causale?: string
  }
  mittente: {
    ragione_sociale: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  destinatario: {
    ragione_sociale: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  trasporto: {
    trasportatore?: string
    mezzo?: string
    porto?: string
    aspetto_beni?: string
    numero_colli?: number
    peso_lordo?: number
    peso_netto?: number
    data_ritiro?: string
    ora_ritiro?: string
  }
  dettagli: Array<{
    codice: string
    descrizione: string
    quantita: number
    unita: string
  }>
  note?: string
}

export default function DDT({ azienda, ddt, mittente, destinatario, trasporto, dettagli, note }: Props) {
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
          </View>
          <View style={commonStyles.headerRight}>
            <Text style={commonStyles.documentTitle}>DOCUMENTO DI TRASPORTO</Text>
            <Text style={commonStyles.documentNumber}>N. {ddt.numero}</Text>
            <Text style={commonStyles.documentDate}>Data: {new Date(ddt.data).toLocaleDateString('it-IT')}</Text>
            {ddt.numero_ordine && (
              <Text style={[commonStyles.documentDate, { marginTop: 5 }]}>Rif. Ordine: {ddt.numero_ordine}</Text>
            )}
          </View>
        </View>

        {/* Mittente e Destinatario */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ width: '48%', borderWidth: 1, borderColor: '#D1D5DB', padding: 10, borderRadius: 4 }}>
            <Text style={[commonStyles.sectionTitle, { borderBottomWidth: 0, paddingBottom: 0 }]}>MITTENTE</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5, marginTop: 5 }}>{mittente.ragione_sociale}</Text>
            {mittente.indirizzo && (
              <Text style={commonStyles.companyInfo}>
                {mittente.indirizzo}
              </Text>
            )}
            <Text style={commonStyles.companyInfo}>
              {mittente.cap} {mittente.citta} {mittente.provincia && `(${mittente.provincia})`}
            </Text>
          </View>

          <View style={{ width: '4%' }} />

          <View style={{ width: '48%', borderWidth: 1, borderColor: '#D1D5DB', padding: 10, borderRadius: 4 }}>
            <Text style={[commonStyles.sectionTitle, { borderBottomWidth: 0, paddingBottom: 0 }]}>DESTINATARIO</Text>
            <Text style={{ fontFamily: 'Helvetica-Bold', marginBottom: 5, marginTop: 5 }}>{destinatario.ragione_sociale}</Text>
            {destinatario.indirizzo && (
              <Text style={commonStyles.companyInfo}>
                {destinatario.indirizzo}
              </Text>
            )}
            <Text style={commonStyles.companyInfo}>
              {destinatario.cap} {destinatario.citta} {destinatario.provincia && `(${destinatario.provincia})`}
            </Text>
          </View>
        </View>

        {/* Info Trasporto */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>DATI TRASPORTO</Text>
            {trasporto.trasportatore && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Trasportatore:</Text>
                <Text style={commonStyles.value}>{trasporto.trasportatore}</Text>
              </View>
            )}
            {trasporto.mezzo && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Mezzo:</Text>
                <Text style={commonStyles.value}>{trasporto.mezzo}</Text>
              </View>
            )}
            {trasporto.porto && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Porto:</Text>
                <Text style={commonStyles.value}>{trasporto.porto}</Text>
              </View>
            )}
            {ddt.causale && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Causale:</Text>
                <Text style={commonStyles.value}>{ddt.causale}</Text>
              </View>
            )}
          </View>

          <View style={{ width: '4%' }} />

          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>ASPETTO ESTERIORE BENI</Text>
            {trasporto.aspetto_beni && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Aspetto:</Text>
                <Text style={commonStyles.value}>{trasporto.aspetto_beni}</Text>
              </View>
            )}
            {trasporto.numero_colli !== undefined && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>N. Colli:</Text>
                <Text style={commonStyles.value}>{trasporto.numero_colli}</Text>
              </View>
            )}
            {trasporto.peso_lordo !== undefined && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Peso Lordo:</Text>
                <Text style={commonStyles.value}>{trasporto.peso_lordo.toFixed(2)} kg</Text>
              </View>
            )}
            {trasporto.peso_netto !== undefined && (
              <View style={commonStyles.row}>
                <Text style={commonStyles.label}>Peso Netto:</Text>
                <Text style={commonStyles.value}>{trasporto.peso_netto.toFixed(2)} kg</Text>
              </View>
            )}
          </View>
        </View>

        {/* Tabella Prodotti */}
        <View style={commonStyles.section}>
          <Text style={commonStyles.sectionTitle}>ELENCO MERCE</Text>
          <View style={commonStyles.table}>
            {/* Header */}
            <View style={commonStyles.tableHeader}>
              <Text style={[commonStyles.tableHeaderCell, { width: ddtTableWidths.codice }]}>Codice</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: ddtTableWidths.descrizione }]}>Descrizione</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: ddtTableWidths.quantita, textAlign: 'right' }]}>Quantità</Text>
              <Text style={[commonStyles.tableHeaderCell, { width: ddtTableWidths.unita, textAlign: 'center' }]}>U.M.</Text>
            </View>

            {/* Rows */}
            {dettagli.map((item, index) => (
              <View key={index} style={index % 2 === 0 ? commonStyles.tableRow : commonStyles.tableRowAlt}>
                <Text style={[commonStyles.tableCell, { width: ddtTableWidths.codice }]}>{item.codice}</Text>
                <Text style={[commonStyles.tableCell, { width: ddtTableWidths.descrizione }]}>{item.descrizione}</Text>
                <Text style={[commonStyles.tableCell, { width: ddtTableWidths.quantita, textAlign: 'right' }]}>
                  {item.quantita}
                </Text>
                <Text style={[commonStyles.tableCell, { width: ddtTableWidths.unita, textAlign: 'center' }]}>
                  {item.unita}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Note */}
        {note && (
          <View style={commonStyles.notes}>
            <Text style={commonStyles.notesTitle}>NOTE:</Text>
            <Text style={commonStyles.notesText}>{note}</Text>
          </View>
        )}

        {/* Data e Ora Ritiro / Firma */}
        <View style={{ flexDirection: 'row', marginTop: 30 }}>
          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>DATA/ORA RITIRO</Text>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <View style={{ width: '50%' }}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Data:</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#9CA3AF', marginTop: 15, marginRight: 10 }} />
              </View>
              <View style={{ width: '50%' }}>
                <Text style={{ fontSize: 9, color: '#6B7280' }}>Ora:</Text>
                <View style={{ borderBottomWidth: 1, borderBottomColor: '#9CA3AF', marginTop: 15 }} />
              </View>
            </View>
          </View>

          <View style={{ width: '4%' }} />

          <View style={{ width: '48%' }}>
            <Text style={commonStyles.sectionTitle}>FIRMA VETTORE/DESTINATARIO</Text>
            <View style={{ borderBottomWidth: 1, borderBottomColor: '#9CA3AF', marginTop: 40 }} />
          </View>
        </View>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <Text style={commonStyles.footerText}>
            DDT emesso ai sensi del DPR 472/96 - {azienda.ragione_sociale || azienda.nome}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
