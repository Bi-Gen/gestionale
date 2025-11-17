import { getFornitore, updateFornitore } from '@/app/actions/fornitori'
import FornitoreForm from '@/components/FornitoreForm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ModificaFornitorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const fornitore = await getFornitore(id)

  if (!fornitore) {
    redirect('/dashboard/fornitori?error=Fornitore non trovato')
  }

  const updateFornitoreWithId = updateFornitore.bind(null, id)

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/fornitori"
          className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-flex items-center gap-1"
        >
          ← Torna ai Fornitori
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Modifica Fornitore</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl">
        {/* Error Message */}
        {query.error && (
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
                  {query.error}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <FornitoreForm action={updateFornitoreWithId} initialData={fornitore} submitLabel="Salva Modifiche" />
        </div>
      </div>
    </div>
  )
}
