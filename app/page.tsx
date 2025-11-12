import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Gestionale
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema di gestione aziendale con Supabase
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Accedi
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-white text-blue-600 font-medium rounded-md border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Registrati
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Clienti e Fornitori</h2>
            <p className="text-gray-600">Gestione completa anagrafiche</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Prodotti</h2>
            <p className="text-gray-600">Catalogo e gestione magazzino</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Ordini</h2>
            <p className="text-gray-600">Simulazione e gestione ordini</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Sicurezza</h2>
            <p className="text-gray-600">Dati protetti e privati per ogni utente</p>
          </div>
        </div>
      </div>
    </main>
  );
}
