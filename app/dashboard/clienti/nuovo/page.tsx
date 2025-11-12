import { createCliente } from '@/app/actions/clienti'
import Link from 'next/link'

export default async function NuovoClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/clienti"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna ai Clienti
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Cliente</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errore di validazione</h3>
                <div className="mt-2 text-sm text-red-700">
                  {params.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <form action={createCliente} className="space-y-6">
            {/* Ragione Sociale */}
            <div>
              <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700">
                Ragione Sociale *
              </label>
              <input
                type="text"
                name="ragione_sociale"
                id="ragione_sociale"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* P.IVA e Codice Fiscale */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700">
                  Partita IVA
                </label>
                <input
                  type="text"
                  name="partita_iva"
                  id="partita_iva"
                  pattern="\d{11}"
                  maxLength={11}
                  title="Partita IVA deve essere di 11 cifre"
                  placeholder="12345678901"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">11 cifre numeriche</p>
              </div>

              <div>
                <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  name="codice_fiscale"
                  id="codice_fiscale"
                  pattern="[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]"
                  maxLength={16}
                  title="Codice Fiscale formato: RSSMRA80A01H501U"
                  placeholder="RSSMRA80A01H501U"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">16 caratteri alfanumerici</p>
              </div>
            </div>

            {/* Email e Telefono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                  Telefono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  id="telefono"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Indirizzo */}
            <div>
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700">
                Indirizzo
              </label>
              <input
                type="text"
                name="indirizzo"
                id="indirizzo"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Città, CAP, Provincia */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label htmlFor="citta" className="block text-sm font-medium text-gray-700">
                  Città
                </label>
                <input
                  type="text"
                  name="citta"
                  id="citta"
                  placeholder="Milano"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="cap" className="block text-sm font-medium text-gray-700">
                  CAP
                </label>
                <input
                  type="text"
                  name="cap"
                  id="cap"
                  pattern="\d{5}"
                  maxLength={5}
                  title="CAP deve essere di 5 cifre"
                  placeholder="20100"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">5 cifre</p>
              </div>
            </div>

            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                Provincia
              </label>
              <input
                type="text"
                name="provincia"
                id="provincia"
                pattern="[A-Z]{2}"
                maxLength={2}
                title="Provincia in formato 2 lettere maiuscole (es. MI)"
                placeholder="MI"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">2 lettere maiuscole (es. MI, RM, TO)</p>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                name="note"
                id="note"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-end">
              <Link
                href="/dashboard/clienti"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Salva Cliente
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
