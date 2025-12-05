import { NextRequest, NextResponse } from 'next/server'
import { getOrdiniPerReso } from '@/app/actions/magazzino'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const tipoOrdine = searchParams.get('tipo') as 'acquisto' | 'vendita'
    const soggettoId = searchParams.get('soggetto_id')

    if (!tipoOrdine) {
      return NextResponse.json({ error: 'Missing tipo parameter' }, { status: 400 })
    }

    const ordini = await getOrdiniPerReso(
      tipoOrdine,
      soggettoId ? Number(soggettoId) : undefined
    )

    return NextResponse.json(ordini)
  } catch (error) {
    console.error('Error fetching ordini per reso:', error)
    return NextResponse.json({ error: 'Failed to fetch ordini' }, { status: 500 })
  }
}
