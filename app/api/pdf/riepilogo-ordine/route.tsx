import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import RiepilogoOrdine from '@/lib/pdf/RiepilogoOrdine'
import { getOrdinePDF } from '@/app/actions/ordini'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ordineId = searchParams.get('id')

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

    // Genera PDF
    const pdfBuffer = await renderToBuffer(
      <RiepilogoOrdine
        azienda={dati.azienda}
        ordine={{
          numero_ordine: dati.ordine.numero_ordine,
          data_ordine: dati.ordine.data_ordine,
          stato: dati.ordine.stato,
          note: dati.ordine.note,
          data_consegna_prevista: dati.ordine.data_consegna_prevista
        }}
        cliente={dati.cliente}
        indirizzoSpedizione={dati.indirizzoSpedizione || undefined}
        dettagli={dati.dettagli}
        totali={dati.totali}
        trasporto={{
          costo_stimato: dati.ordine.costo_trasporto,
          peso_totale: dati.ordine.peso_totale_kg,
          incoterm: dati.incoterm?.codice,
          incoterm_nome: dati.incoterm?.nome,
          trasporto_a_carico: dati.incoterm?.trasporto_a_carico
        }}
        pagamento={dati.metodoPagamento ? {
          metodo: dati.metodoPagamento.nome,
          giorni_scadenza: dati.metodoPagamento.giorni_scadenza
        } : undefined}
        agente={dati.agente ? {
          ragione_sociale: dati.agente.ragione_sociale,
          codice_agente: dati.agente.codice_agente,
          telefono: dati.agente.telefono,
          email: dati.agente.email
        } : undefined}
      />
    )

    // Converti Buffer in Uint8Array per NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Restituisci PDF
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Riepilogo_Ordine_${dati.ordine.numero_ordine}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Errore generazione PDF:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione del PDF' },
      { status: 500 }
    )
  }
}
