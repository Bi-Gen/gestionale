import { getValuta, updateValuta } from '@/app/actions/valute'
import ValutaForm from '@/components/ValutaForm'
import { notFound } from 'next/navigation'

export default async function ModificaValutaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const valuta = await getValuta(parseInt(id))

  if (!valuta) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Valuta
        </h1>
        <p className="text-sm text-gray-600 mt-1">Modifica: {valuta.nome}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <ValutaForm
          valuta={valuta}
          action={updateValuta.bind(null, valuta.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
