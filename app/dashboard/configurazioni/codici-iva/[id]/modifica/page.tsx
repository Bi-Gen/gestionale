import { getAliquotaIva, updateAliquotaIva } from '@/app/actions/aliquote-iva'
import AliquotaIvaForm from '@/components/AliquotaIvaForm'
import { notFound } from 'next/navigation'

export default async function ModificaAliquotaIvaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const aliquota = await getAliquotaIva(parseInt(id))

  if (!aliquota) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Aliquota IVA
        </h1>
        <p className="text-sm text-gray-600 mt-1">Modifica: {aliquota.descrizione}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <AliquotaIvaForm
          aliquota={aliquota}
          action={updateAliquotaIva.bind(null, aliquota.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
