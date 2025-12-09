'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type Azienda = {
  id: string
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
  logo_url?: string
  colore_primario?: string
}

export async function getAziendaCorrente(): Promise<Azienda | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Ottieni azienda_id dall'utente corrente
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    return null
  }

  // Ottieni i dati dell'azienda
  const { data: azienda, error } = await supabase
    .from('azienda')
    .select('id, nome, ragione_sociale, partita_iva, codice_fiscale, email, telefono, indirizzo, cap, citta, provincia, logo_url, colore_primario')
    .eq('id', utenteAzienda.azienda_id)
    .single()

  if (error) {
    console.error('Errore recupero azienda:', error)
    return null
  }

  return azienda
}
