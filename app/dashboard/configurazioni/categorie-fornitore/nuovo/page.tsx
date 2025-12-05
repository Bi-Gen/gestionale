import { createCategoriaFornitore, getContiCosti } from '@/app/actions/categorie-fornitore'
import CategoriaFornitoreForm from '@/components/CategoriaFornitoreForm'

export default async function NuovaCategoriaFornitorePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [params, contiCosti] = await Promise.all([
    searchParams,
    getContiCosti()
  ])

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Categoria Fornitore</h1>
        <p className="text-sm text-gray-600 mt-1">
          Crea una nuova categoria per classificare i fornitori
        </p>
      </div>

      {/* Form */}
      <CategoriaFornitoreForm
        contiCosti={contiCosti}
        action={createCategoriaFornitore}
        error={params.error}
      />
    </div>
  )
}
