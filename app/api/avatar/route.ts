import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verifica autenticazione
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Utente non autenticato' },
        { status: 401 }
      )
    }

    // Ottieni il file dal form data
    const formData = await request.formData()
    const file = formData.get('avatar') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file selezionato' },
        { status: 400 }
      )
    }

    // Validazione tipo file
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Il file deve essere un\'immagine' },
        { status: 400 }
      )
    }

    // Validazione dimensione (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'L\'immagine deve essere inferiore a 2MB' },
        { status: 400 }
      )
    }

    // Estrai estensione
    const fileExt = file.name.split('.').pop() || 'jpg'
    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

    // Converti in buffer
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    console.log('Uploading avatar:', { fileName, size: fileBuffer.length, type: file.type })

    // Upload su Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: `Errore nel caricamento: ${uploadError.message}` },
        { status: 500 }
      )
    }

    console.log('Upload success:', uploadData)

    // Ottieni URL pubblico
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)

    // Aggiorna metadata utente
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl
      }
    })

    if (updateError) {
      console.error('Update user error:', updateError)
      return NextResponse.json(
        { error: `Errore nell'aggiornamento profilo: ${updateError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ avatarUrl: publicUrl })
  } catch (error) {
    console.error('Avatar upload exception:', error)
    return NextResponse.json(
      { error: `Errore imprevisto: ${error instanceof Error ? error.message : 'errore sconosciuto'}` },
      { status: 500 }
    )
  }
}
