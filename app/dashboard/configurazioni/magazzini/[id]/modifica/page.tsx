import { getMagazzino, updateMagazzino } from '@/app/actions/magazzini'
import MagazzinoForm from '@/components/MagazzinoForm'
import { notFound } from 'next/navigation'

export default async function ModificaMagazzinoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams

  const magazzino = await getMagazzino(parseInt(id))

  if (!magazzino) {
    notFound()
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Magazzino
        </h1>
        <p className="text-sm text-gray-600 mt-1">Modifica: {magazzino.nome}</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <MagazzinoForm
          magazzino={magazzino}
          action={updateMagazzino.bind(null, magazzino.id)}
          submitLabel="Salva Modifiche"
        />
      </div>
    </div>
  )
}
