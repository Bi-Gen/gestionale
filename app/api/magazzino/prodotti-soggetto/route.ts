import { NextRequest, NextResponse } from 'next/server'
import { getProdottiBysoggetto } from '@/app/actions/magazzino'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const soggettoId = searchParams.get('soggetto_id')
    const tipoOperazione = searchParams.get('tipo') as 'vendita' | 'acquisto'

    if (!soggettoId || !tipoOperazione) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const prodotti = await getProdottiBysoggetto(Number(soggettoId), tipoOperazione)
    return NextResponse.json(prodotti)
  } catch (error) {
    console.error('Error fetching prodotti by soggetto:', error)
    return NextResponse.json({ error: 'Failed to fetch prodotti' }, { status: 500 })
  }
}
