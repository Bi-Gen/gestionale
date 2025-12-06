import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/quick-create
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticazione
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
    }

    // Ottieni azienda_id
    const { data: utenteAzienda } = await supabase
      .from('utente_azienda')
      .select('azienda_id')
      .eq('user_id', user.id)
      .single()

    if (!utenteAzienda?.azienda_id) {
      return NextResponse.json({ success: false, error: 'Nessuna azienda associata' }, { status: 400 })
    }

    const aziendaId = utenteAzienda.azienda_id
    const body = await request.json()
    const { entityType, ...fields } = body

    let tableName: string
    let insertData: Record<string, unknown>
    let selectFields: string

    switch (entityType) {
      case 'macrofamiglia':
        tableName = 'macrofamiglie'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          attivo: true,
          ordinamento: 0
        }
        selectFields = 'id, codice, nome'
        break

      case 'famiglia':
        tableName = 'famiglie'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          macrofamiglia_id: fields.macrofamiglia_id || null,
          attivo: true,
          ordinamento: 0
        }
        selectFields = 'id, codice, nome, macrofamiglia_id'
        break

      case 'linea':
        tableName = 'linee_prodotto'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          attivo: true,
          ordinamento: 0
        }
        selectFields = 'id, codice, nome'
        break

      case 'categoria_cliente':
        tableName = 'categorie_cliente'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome
        }
        selectFields = 'id, codice, nome'
        break

      case 'categoria_fornitore':
        tableName = 'categorie_fornitore'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome
        }
        selectFields = 'id, codice, nome'
        break

      case 'listino':
        tableName = 'listino'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          tipo: fields.tipo || 'vendita',
          attivo: true
        }
        selectFields = 'id, codice, nome'
        break

      case 'codice_pagamento':
        tableName = 'codici_pagamento'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          descrizione: fields.descrizione || fields.nome,
          giorni_scadenza: fields.giorni_scadenza || 30
        }
        selectFields = 'id, codice, descrizione'
        break

      case 'causale_movimento':
        tableName = 'causali_movimento'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          descrizione: fields.descrizione || fields.nome,
          tipo_movimento: fields.tipo_movimento || 'carico'
        }
        selectFields = 'id, codice, descrizione'
        break

      case 'magazzino':
        tableName = 'magazzino'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          attivo: true
        }
        selectFields = 'id, codice, nome'
        break

      default:
        return NextResponse.json({ success: false, error: `Tipo entità non supportato: ${entityType}` }, { status: 400 })
    }

    // Inserisci nel database
    const { data, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select(selectFields)
      .single()

    if (error) {
      console.error(`Errore creazione ${entityType}:`, error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })

  } catch (err) {
    console.error('Errore API quick-create:', err)
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 })
  }
}
