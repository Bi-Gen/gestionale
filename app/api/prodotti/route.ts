import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('prodotto')
    .select('id, codice, descrizione, prezzo_vendita, prezzo_acquisto, unita_misura')
    .eq('attivo', true)
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento prodotti:', error)
    return NextResponse.json([], { status: 500 })
  }

  return NextResponse.json(data || [])
}
