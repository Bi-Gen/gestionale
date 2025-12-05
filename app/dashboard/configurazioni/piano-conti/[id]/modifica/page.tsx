import { getConto, updateConto, getContiParent } from '@/app/actions/piano-conti'
import PianoContiForm from '@/components/PianoContiForm'
import { notFound } from 'next/navigation'

export default async function ModificaContoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const [query, contiParent] = await Promise.all([
    searchParams,
    getContiParent(parseInt(id))
  ])

  const conto = await getConto(parseInt(id))

  if (!conto) {
    notFound()
  }

  const updateWithId = async (formData: FormData) => {
    'use server'
    await updateConto(conto.id, formData)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {conto.modificabile ? 'Modifica Conto' : 'Dettagli Conto'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {conto.codice} - {conto.descrizione}
        </p>
      </div>

      <PianoContiForm
        conto={conto}
        contiParent={contiParent}
        action={updateWithId}
        error={query.error}
      />
    </div>
  )
}
