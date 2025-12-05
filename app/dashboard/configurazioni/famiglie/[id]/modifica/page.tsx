import { getFamiglia, updateFamiglia } from '@/app/actions/famiglie'
import { getMacrofamiglie } from '@/app/actions/macrofamiglie'
import FamigliaForm from '@/components/FamigliaForm'
import { notFound } from 'next/navigation'

export default async function ModificaFamigliaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const [famiglia, macrofamiglie] = await Promise.all([
    getFamiglia(parseInt(id)),
    getMacrofamiglie(),
  ])

  if (!famiglia) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Famiglia
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Modifica: {famiglia.nome}
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
        <FamigliaForm
          famiglia={famiglia}
          macrofamiglie={macrofamiglie}
          action={updateFamiglia.bind(null, famiglia.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
