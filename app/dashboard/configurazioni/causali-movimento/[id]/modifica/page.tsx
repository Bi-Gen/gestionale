import { getCausaleMovimento, updateCausaleMovimento } from '@/app/actions/causali-movimento'
import CausaleMovimentoForm from '@/components/CausaleMovimentoForm'
import { notFound } from 'next/navigation'

export default async function ModificaCausaleMovimentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const causale = await getCausaleMovimento(parseInt(id))

  if (!causale) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Causale Movimento
        </h1>
        <p className="text-sm text-gray-600 mt-1">Modifica: {causale.descrizione}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <CausaleMovimentoForm
          causale={causale}
          action={updateCausaleMovimento.bind(null, causale.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
