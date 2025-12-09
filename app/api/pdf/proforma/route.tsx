import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import Proforma from '@/lib/pdf/Proforma'
import { getOrdinePDF } from '@/app/actions/ordini'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ordineId = searchParams.get('id')
  const numeroFattura = searchParams.get('numero_fattura') || undefined
  const scadenzaGiorni = parseInt(searchParams.get('scadenza_giorni') || '30')

  if (!ordineId) {
    return NextResponse.json({ error: 'ID ordine mancante' }, { status: 400 })
  }

  try {
    const dati = await getOrdinePDF(ordineId)

    if (!dati) {
      return NextResponse.json({ error: 'Ordine non trovato' }, { status: 404 })
    }

    if (!dati.cliente) {
      return NextResponse.json({ error: 'Cliente non associato all\'ordine' }, { status: 400 })
    }

    // Calcola data scadenza pagamento
    const dataOrdine = new Date(dati.ordine.data_ordine)
    const scadenzaPagamento = new Date(dataOrdine)
    scadenzaPagamento.setDate(scadenzaPagamento.getDate() + scadenzaGiorni)

    // Genera PDF
    const pdfBuffer = await renderToBuffer(
      <Proforma
        azienda={dati.azienda}
        proforma={{
          numero_proforma: `PF-${dati.ordine.numero_ordine}`,
          numero_fattura: numeroFattura,
          data: dati.ordine.data_ordine,
          numero_ordine: dati.ordine.numero_ordine,
          scadenza_pagamento: scadenzaPagamento.toISOString().split('T')[0]
        }}
        cliente={dati.cliente}
        dettagli={dati.dettagli}
        totali={dati.totali}
        pagamento={{
          metodo: 'Bonifico Bancario',
        }}
        note={dati.ordine.note}
      />
    )

    // Converti Buffer in Uint8Array per NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Restituisci PDF
    const fileName = numeroFattura
      ? `Proforma_${numeroFattura}.pdf`
      : `Proforma_${dati.ordine.numero_ordine}.pdf`

    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    })
  } catch (error) {
    console.error('Errore generazione Proforma:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione della Proforma' },
      { status: 500 }
    )
  }
}
