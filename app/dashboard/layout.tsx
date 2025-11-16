import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import { DashboardLayoutWrapper, MainContentWrapper, HamburgerButton } from '@/components/DashboardLayoutWrapper'
import { logout } from '@/app/actions/auth'

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

  return (
    <DashboardLayoutWrapper>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <MainContentWrapper>
          {/* Top Header */}
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <HamburgerButton />
                <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">Gestionale</h2>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">{user.email}</span>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                  >
                    Logout
                  </button>
                </form>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </MainContentWrapper>
      </div>
    </DashboardLayoutWrapper>
  )
}
