'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface Azienda {
  id: string
  nome: string
  ragione_sociale: string | null
  partita_iva: string | null
  email: string
  piano: string
  stato: string
  logo_url: string | null
  colore_primario: string | null
  trial_fino_a: string | null
  features_abilitate: Record<string, any>
}

interface UtenteAzienda {
  id: string
  user_id: string
  azienda_id: string
  nome: string
  cognome: string
  ruolo: string
  permessi: Record<string, any>
  attivo: boolean
}

interface AuthContextType {
  user: User | null
  azienda: Azienda | null
  utenteAzienda: UtenteAzienda | null
  isSuperadmin: boolean
  isLoading: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  azienda: null,
  utenteAzienda: null,
  isSuperadmin: false,
  isLoading: true,
  refetch: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [azienda, setAzienda] = useState<Azienda | null>(null)
  const [utenteAzienda, setUtenteAzienda] = useState<UtenteAzienda | null>(null)
  const [isSuperadmin, setIsSuperadmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  const fetchUserData = async () => {
    try {
      setIsLoading(true)

      // 1. Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        setUser(null)
        setAzienda(null)
        setUtenteAzienda(null)
        setIsSuperadmin(false)
        setIsLoading(false)
        return
      }

      setUser(currentUser)

      // 2. Check if superadmin
      const { data: superadminData } = await supabase
        .rpc('is_superadmin')
        .single()

      setIsSuperadmin(Boolean(superadminData))

      // 3. Get utente_azienda data
      const { data: utenteAziendaData, error: utenteError } = await supabase
        .from('utente_azienda')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('attivo', true)
        .single()

      if (utenteError) {
        console.log('No utente_azienda found (might be first login or superadmin):', utenteError.message)
        setUtenteAzienda(null)
        setAzienda(null)
      } else {
        setUtenteAzienda(utenteAziendaData)

        // 4. Get azienda data separately
        if (utenteAziendaData?.azienda_id) {
          const { data: aziendaData, error: aziendaError } = await supabase
            .from('azienda')
            .select('*')
            .eq('id', utenteAziendaData.azienda_id)
            .single()

          if (aziendaError) {
            console.error('Error fetching azienda:', aziendaError.message)
            setAzienda(null)
          } else {
            setAzienda(aziendaData)
          }
        }
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserData()
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setAzienda(null)
        setUtenteAzienda(null)
        setIsSuperadmin(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        azienda,
        utenteAzienda,
        isSuperadmin,
        isLoading,
        refetch: fetchUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
