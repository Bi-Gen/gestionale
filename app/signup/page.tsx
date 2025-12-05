import { signup } from '@/app/actions/auth'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Registrazione
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Oppure{' '}
            <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
              accedi se hai già un account
            </Link>
          </p>
        </div>

        {params.error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" action={signup}>
          {/* Dati Azienda */}
          <div className="space-y-4">
            <div>
              <label htmlFor="nome_azienda" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Azienda *
              </label>
              <input
                id="nome_azienda"
                name="nome_azienda"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Es: Acme SRL"
              />
            </div>

            <div>
              <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700 mb-1">
                Ragione Sociale
              </label>
              <input
                id="ragione_sociale"
                name="ragione_sociale"
                type="text"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Opzionale"
              />
            </div>

            <div>
              <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700 mb-1">
                Partita IVA
              </label>
              <input
                id="partita_iva"
                name="partita_iva"
                type="text"
                maxLength={11}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="11 cifre (opzionale)"
              />
            </div>
          </div>

          {/* Dati Utente */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  id="nome"
                  name="nome"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Nome"
                />
              </div>
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome *
                </label>
                <input
                  id="cognome"
                  name="cognome"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Cognome"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="tua@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Minimo 6 caratteri"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Registrati
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
