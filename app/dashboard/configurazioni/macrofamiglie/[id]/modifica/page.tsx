import { getMacrofamiglia, updateMacrofamiglia } from '@/app/actions/macrofamiglie'
import MacrofamigliaForm from '@/components/MacrofamigliaForm'
import { notFound } from 'next/navigation'

export default async function ModificaMacrofamigliaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const macrofamiglia = await getMacrofamiglia(parseInt(id))

  if (!macrofamiglia) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Macrofamiglia
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Modifica: {macrofamiglia.nome}
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
        <MacrofamigliaForm
          macrofamiglia={macrofamiglia}
          action={updateMacrofamiglia.bind(null, macrofamiglia.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
