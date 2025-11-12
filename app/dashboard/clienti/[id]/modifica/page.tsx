import { getCliente, updateCliente } from '@/app/actions/clienti'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ModificaClientePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cliente = await getCliente(id)

  if (!cliente) {
    redirect('/dashboard/clienti?error=Cliente non trovato')
  }

  const updateClienteWithId = updateCliente.bind(null, id)

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
          <h1 className="text-2xl font-bold text-gray-900">Modifica Cliente</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <form action={updateClienteWithId} className="space-y-6">
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
                defaultValue={cliente.ragione_sociale}
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
                  maxLength={11}
                  defaultValue={cliente.partita_iva || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
                  Codice Fiscale
                </label>
                <input
                  type="text"
                  name="codice_fiscale"
                  id="codice_fiscale"
                  maxLength={16}
                  defaultValue={cliente.codice_fiscale || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
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
                  defaultValue={cliente.email || ''}
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
                  defaultValue={cliente.telefono || ''}
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
                defaultValue={cliente.indirizzo || ''}
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
                  defaultValue={cliente.citta || ''}
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
                  maxLength={5}
                  defaultValue={cliente.cap || ''}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
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
                maxLength={2}
                placeholder="ES: MI"
                defaultValue={cliente.provincia || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
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
                defaultValue={cliente.note || ''}
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
                Salva Modifiche
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
