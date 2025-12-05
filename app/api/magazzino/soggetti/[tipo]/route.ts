import { NextRequest, NextResponse } from 'next/server'
import { getSoggettiByTipo } from '@/app/actions/magazzino'

export async function GET(
  request: NextRequest,
  { params }: { params: { tipo: string } }
) {
  try {
    const tipo = params.tipo as 'cliente' | 'fornitore' | 'tutti'
    const soggetti = await getSoggettiByTipo(tipo === 'tutti' ? undefined : tipo)
    return NextResponse.json(soggetti)
  } catch (error) {
    console.error('Error fetching soggetti:', error)
    return NextResponse.json({ error: 'Failed to fetch soggetti' }, { status: 500 })
  }
}
