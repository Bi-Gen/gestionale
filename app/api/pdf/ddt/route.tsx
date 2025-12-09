import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import DDT from '@/lib/pdf/DDT'
import { getOrdinePDF } from '@/app/actions/ordini'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ordineId = searchParams.get('id')
  const numeroDdt = searchParams.get('numero') || ''
  const causale = searchParams.get('causale') || 'Vendita'

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

    // Numero DDT: usa quello passato o genera da ordine
    const ddtNumero = numeroDdt || `DDT-${dati.ordine.numero_ordine}`

    // Prepara mittente (azienda)
    const mittente = {
      ragione_sociale: dati.azienda.ragione_sociale || dati.azienda.nome,
      indirizzo: dati.azienda.indirizzo,
      cap: dati.azienda.cap,
      citta: dati.azienda.citta,
      provincia: dati.azienda.provincia
    }

    // Prepara destinatario (indirizzo spedizione o cliente)
    const destinatario = dati.indirizzoSpedizione ? {
      ragione_sociale: dati.indirizzoSpedizione.denominazione,
      indirizzo: dati.indirizzoSpedizione.indirizzo,
      cap: dati.indirizzoSpedizione.cap,
      citta: dati.indirizzoSpedizione.citta,
      provincia: dati.indirizzoSpedizione.provincia
    } : {
      ragione_sociale: dati.cliente.ragione_sociale,
      indirizzo: dati.cliente.indirizzo,
      cap: dati.cliente.cap,
      citta: dati.cliente.citta,
      provincia: dati.cliente.provincia
    }

    // Prepara dettagli merce (senza prezzi per DDT)
    const dettagliDdt = dati.dettagli.map(d => ({
      codice: d.codice,
      descrizione: d.descrizione,
      quantita: d.quantita,
      unita: d.unita
    }))

    // Genera PDF
    const pdfBuffer = await renderToBuffer(
      <DDT
        azienda={dati.azienda}
        ddt={{
          numero: ddtNumero,
          data: new Date().toISOString().split('T')[0],
          numero_ordine: dati.ordine.numero_ordine,
          causale: causale
        }}
        mittente={mittente}
        destinatario={destinatario}
        trasporto={{
          trasportatore: dati.trasportatore?.ragione_sociale,
          porto: dati.incoterm?.codice,
          peso_lordo: dati.ordine.peso_totale_kg,
          numero_colli: dettagliDdt.length
        }}
        dettagli={dettagliDdt}
        note={dati.ordine.note}
      />
    )

    // Converti Buffer in Uint8Array per NextResponse
    const uint8Array = new Uint8Array(pdfBuffer)

    // Restituisci PDF
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${ddtNumero}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Errore generazione DDT:', error)
    return NextResponse.json(
      { error: 'Errore nella generazione del DDT' },
      { status: 500 }
    )
  }
}
