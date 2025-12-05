import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProfiloForm from './ProfiloForm'

export default async function ProfiloPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userData = {
    id: user.id,
    email: user.email || '',
    fullName: user.user_metadata?.full_name || '',
    avatarUrl: user.user_metadata?.avatar_url || null,
    phone: user.user_metadata?.phone || '',
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Il mio Profilo</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestisci le tue informazioni personali
        </p>
      </div>

      <ProfiloForm user={userData} />
    </div>
  )
}
