import { getTipoSoggetto, updateTipoSoggetto } from '@/app/actions/tipi-soggetto'
import TipoSoggettoForm from '@/components/TipoSoggettoForm'
import { notFound } from 'next/navigation'

export default async function ModificaTipoSoggettoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const tipo = await getTipoSoggetto(parseInt(id))

  if (!tipo) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Tipo Soggetto
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Modifica il tipo: {tipo.nome}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <TipoSoggettoForm
          tipo={tipo}
          action={updateTipoSoggetto.bind(null, tipo.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
