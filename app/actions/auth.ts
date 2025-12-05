'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  // Dati utente
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nome = formData.get('nome') as string
  const cognome = formData.get('cognome') as string

  // Dati azienda
  const nomeAzienda = formData.get('nome_azienda') as string
  const ragioneSociale = (formData.get('ragione_sociale') as string) || nomeAzienda
  const partitaIva = formData.get('partita_iva') as string

  try {
    // 1. Crea utente in auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome,
          cognome,
        }
      }
    })

    if (authError) {
      redirect(`/signup?error=${encodeURIComponent(authError.message)}`)
    }

    if (!authData.user) {
      redirect(`/signup?error=${encodeURIComponent('Errore nella creazione utente')}`)
    }

    const userId = authData.user.id

    // 2. Crea azienda (con piano 'light' di default)
    const { data: aziendaData, error: aziendaError } = await supabase
      .from('azienda')
      .insert({
        nome: nomeAzienda,
        ragione_sociale: ragioneSociale,
        partita_iva: partitaIva || null,
        email: email,
        piano: 'light',
        stato: 'trial',
        trial_fino_a: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 giorni
        owner_user_id: userId,
      })
      .select()
      .single()

    if (aziendaError) {
      redirect(`/signup?error=${encodeURIComponent('Errore nella creazione azienda: ' + aziendaError.message)}`)
    }

    // 3. Crea record in utente_azienda (ruolo owner con tutti i permessi)
    const { error: utenteAziendaError } = await supabase
      .from('utente_azienda')
      .insert({
        user_id: userId,
        azienda_id: aziendaData.id,
        ruolo: 'owner',
        permessi: {
          "prodotti": {"read": true, "write": true, "delete": true},
          "soggetti": {"read": true, "write": true, "delete": true},
          "ordini": {"read": true, "write": true, "delete": true},
          "fatture": {"read": true, "write": true, "delete": true},
          "magazzino": {"read": true, "write": true, "delete": true},
          "scadenzario": {"read": true, "write": true, "delete": true},
          "contabilita": {"read": true, "write": true, "delete": true},
          "analytics": {"read": true},
          "configurazioni": {"read": true, "write": true},
          "utenti": {"read": true, "write": true},
          "billing": {"read": true, "write": true}
        },
        invito_accettato: true
      })

    if (utenteAziendaError) {
      // Rollback: elimina azienda (CASCADE DELETE eliminerà le dipendenze)
      await supabase.from('azienda').delete().eq('id', aziendaData.id)
      redirect(`/signup?error=${encodeURIComponent('Errore nella creazione utente azienda: ' + utenteAziendaError.message)}`)
    }

    // Trigger auto-seed (magazzino, IVA, causali) è già gestito dal database

    revalidatePath('/', 'layout')
    redirect('/dashboard')
  } catch (error) {
    console.error('Errore signup:', error)
    redirect(`/signup?error=${encodeURIComponent('Errore imprevisto durante la registrazione')}`)
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string

  const { error } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
      phone: phone,
    }
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard', 'layout')
  return { success: true }
}

export async function updateAvatar(formData: FormData) {
  try {
    const supabase = await createClient()

    const file = formData.get('avatar')

    // Verifica che il file esista e sia un File/Blob
    if (!file || !(file instanceof Blob)) {
      console.error('File non valido:', file, typeof file)
      return { error: 'Nessun file selezionato' }
    }

    // Recupera l'utente corrente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: 'Utente non autenticato' }
    }

    // Estrai l'estensione dal nome del file (se disponibile) o dal tipo MIME
    let fileExt = 'jpg'
    if (file instanceof File && file.name) {
      fileExt = file.name.split('.').pop() || 'jpg'
    } else if (file.type) {
      // Estrai estensione dal tipo MIME (es: image/jpeg -> jpeg)
      fileExt = file.type.split('/').pop() || 'jpg'
    }

    const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

    // Converti il file in ArrayBuffer per l'upload
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    console.log('Uploading avatar:', { fileName, size: fileBuffer.length, type: file.type })

    // Upload su Supabase Storage (bucket 'avatars')
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from('avatars')
      .upload(fileName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'image/jpeg'
      })

    if (uploadError) {
      console.error('Upload error details:', JSON.stringify(uploadError, null, 2))
      return { error: 'Errore nel caricamento: ' + uploadError.message }
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
      return { error: 'Errore nell\'aggiornamento profilo: ' + updateError.message }
    }

    revalidatePath('/dashboard', 'layout')
    return { avatarUrl: publicUrl }
  } catch (error) {
    console.error('updateAvatar exception:', error)
    return { error: 'Errore durante il caricamento: ' + (error instanceof Error ? error.message : 'errore sconosciuto') }
  }
}
