import { StyleSheet } from '@react-pdf/renderer'

// Stili comuni per tutti i documenti PDF
export const commonStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
    paddingBottom: 15,
  },
  headerLeft: {
    width: '60%',
  },
  headerRight: {
    width: '35%',
    textAlign: 'right',
  },
  companyName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  companyInfo: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  documentTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
    marginBottom: 5,
  },
  documentNumber: {
    fontSize: 12,
    color: '#374151',
  },
  documentDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: '30%',
    color: '#6B7280',
    fontSize: 9,
  },
  value: {
    width: '70%',
    color: '#1F2937',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  tableRowAlt: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 8,
    paddingHorizontal: 5,
    backgroundColor: '#F9FAFB',
  },
  tableCell: {
    fontSize: 9,
    color: '#1F2937',
  },
  totalsSection: {
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#3B82F6',
    paddingTop: 15,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
    width: 200,
    justifyContent: 'space-between',
  },
  totalLabel: {
    fontSize: 10,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 10,
    color: '#1F2937',
    fontFamily: 'Helvetica-Bold',
  },
  grandTotal: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    width: 200,
    justifyContent: 'space-between',
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#1F2937',
  },
  grandTotalValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#3B82F6',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
  },
  notes: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#92400E',
    marginBottom: 5,
  },
  notesText: {
    fontSize: 9,
    color: '#78350F',
  },
})

// Larghezze colonne per la tabella prodotti
export const productTableWidths = {
  codice: '12%',
  descrizione: '38%',
  quantita: '10%',
  prezzo: '12%',
  sconto: '10%',
  totale: '18%',
}

// Larghezze colonne per DDT (senza prezzi)
export const ddtTableWidths = {
  codice: '15%',
  descrizione: '55%',
  quantita: '15%',
  unita: '15%',
}
