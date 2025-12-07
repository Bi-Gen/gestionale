import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/quick-create
export async function POST(request: NextRequest) {
  console.log('=== API quick-create chiamata ===')

  try {
    const supabase = await createClient()

    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth check:', { userId: user?.id, authError })

    if (!user) {
      console.log('Errore: utente non autenticato')
      return NextResponse.json({ success: false, error: 'Non autenticato' }, { status: 401 })
    }

    // Ottieni azienda_id
    const { data: utenteAzienda, error: aziendaError } = await supabase
      .from('utente_azienda')
      .select('azienda_id')
      .eq('user_id', user.id)
      .single()

    console.log('Azienda check:', { utenteAzienda, aziendaError })

    if (!utenteAzienda?.azienda_id) {
      console.log('Errore: nessuna azienda associata')
      return NextResponse.json({ success: false, error: 'Nessuna azienda associata' }, { status: 400 })
    }

    const aziendaId = utenteAzienda.azienda_id
    const body = await request.json()
    console.log('Request body:', body)
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
          descrizione: fields.descrizione || null,
          attivo: true,
          ordinamento: fields.ordinamento || 0
        }
        selectFields = 'id, codice, nome, descrizione, ordinamento, attivo'
        break

      case 'famiglia':
        tableName = 'famiglie'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          macrofamiglia_id: fields.macrofamiglia_id || null,
          descrizione: fields.descrizione || null,
          attivo: true,
          ordinamento: fields.ordinamento || 0
        }
        selectFields = 'id, codice, nome, macrofamiglia_id, descrizione, ordinamento, attivo'
        break

      case 'linea':
        tableName = 'linee_prodotto'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          descrizione: fields.descrizione || null,
          attivo: true,
          ordinamento: fields.ordinamento || 0
        }
        selectFields = 'id, codice, nome, descrizione, ordinamento, attivo'
        break

      case 'categoria_cliente':
        tableName = 'categoria_cliente'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          descrizione: fields.descrizione || null,
          listino_id: fields.listino_id || null,
          sconto_default: fields.sconto_default || 0,
          priorita: fields.priorita || 0,
          colore: fields.colore || '#6B7280',
          attivo: true
        }
        selectFields = 'id, codice, nome, descrizione, listino_id, sconto_default, priorita, colore, attivo'
        break

      case 'categoria_fornitore':
        tableName = 'categoria_fornitore'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          descrizione: fields.descrizione || null,
          priorita: fields.priorita || 0,
          colore: fields.colore || '#6B7280',
          attivo: true
        }
        selectFields = 'id, codice, nome, descrizione, priorita, colore, attivo'
        break

      case 'listino':
        tableName = 'listino'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          descrizione: fields.descrizione || null,
          tipo: fields.tipo || 'vendita',
          valuta_id: fields.valuta_id || null,
          provvigione_default: fields.provvigione_default || 0,
          priorita: fields.priorita || 0,
          attivo: true
        }
        selectFields = 'id, codice, nome, descrizione, tipo, valuta_id, provvigione_default, priorita, attivo'
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

      case 'tipo_soggetto':
        tableName = 'tipi_soggetto'
        insertData = {
          azienda_id: aziendaId,
          codice: fields.codice,
          nome: fields.nome,
          descrizione: fields.descrizione || null,
          colore: fields.colore || '#3B82F6',
          icona: fields.icona || null,
          attivo: true
        }
        selectFields = 'id, codice, nome, descrizione, colore, icona, attivo'
        break

      default:
        return NextResponse.json({ success: false, error: `Tipo entità non supportato: ${entityType}` }, { status: 400 })
    }

    // Inserisci nel database
    console.log('Inserting into:', tableName)
    console.log('Insert data:', insertData)
    console.log('Select fields:', selectFields)

    const { data, error } = await supabase
      .from(tableName)
      .insert([insertData])
      .select(selectFields)
      .single()

    console.log('Insert result:', { data, error })

    if (error) {
      console.error(`Errore creazione ${entityType}:`, error)
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    console.log('Creazione riuscita:', data)
    return NextResponse.json({ success: true, data })

  } catch (err) {
    console.error('Errore API quick-create:', err)
    return NextResponse.json({ success: false, error: 'Errore interno' }, { status: 500 })
  }
}
