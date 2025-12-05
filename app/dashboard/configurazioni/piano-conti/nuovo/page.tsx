import { createConto, getContiParent, getContiPerCodice } from '@/app/actions/piano-conti'
import PianoContiForm from '@/components/PianoContiForm'

export default async function NuovoContoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; parent?: string }>
}) {
  const [params, contiParent, contiEsistenti] = await Promise.all([
    searchParams,
    getContiParent(),
    getContiPerCodice()
  ])

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Conto</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi un nuovo conto al piano dei conti
        </p>
      </div>

      <PianoContiForm
        contiParent={contiParent}
        contiEsistenti={contiEsistenti}
        action={createConto}
        error={params.error}
      />
    </div>
  )
}
