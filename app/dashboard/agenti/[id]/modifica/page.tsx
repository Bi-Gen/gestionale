import { getAgente, updateAgente } from '@/app/actions/agenti'
import AgenteForm from '@/components/AgenteForm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ModificaAgentePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const agente = await getAgente(id)

  if (!agente) {
    redirect('/dashboard/agenti?error=Agente non trovato')
  }

  const updateAgenteWithId = updateAgente.bind(null, id)

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/dashboard/agenti"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center gap-1"
        >
          ← Torna agli Agenti
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifica Agente</h1>
      </div>

      <div className="max-w-4xl">
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Errore di validazione</h3>
                <div className="mt-2 text-sm text-red-700">{query.error}</div>
              </div>
            </div>
          </div>
        )}

        <AgenteForm action={updateAgenteWithId} initialData={agente} submitLabel="Salva Modifiche" />
      </div>
    </div>
  )
}
