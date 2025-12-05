import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Breadcrumb from '@/components/Breadcrumb'
import { DashboardLayoutWrapper, MainContentWrapper, HamburgerButton } from '@/components/DashboardLayoutWrapper'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera nome utente da metadata o email
  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Utente'
  const userEmail = user.email || ''
  const userAvatar = user.user_metadata?.avatar_url || null

  return (
    <DashboardLayoutWrapper>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          userAvatar={userAvatar}
        />

        {/* Main Content Area */}
        <MainContentWrapper>
          {/* Top Header - Semplificato, logout spostato in sidebar */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <HamburgerButton />
                <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">All in One</h2>
              </div>
              {/* Spazio riservato per notifiche o altre azioni future */}
              <div className="flex items-center gap-4">
                {/* Notifiche, ricerca, etc. potranno andare qui */}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              <Breadcrumb />
              {children}
            </div>
          </main>
        </MainContentWrapper>
      </div>
    </DashboardLayoutWrapper>
  )
}
