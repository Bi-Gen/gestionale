import { getCategoriaFornitore, updateCategoriaFornitore, getContiCosti } from '@/app/actions/categorie-fornitore'
import CategoriaFornitoreForm from '@/components/CategoriaFornitoreForm'
import { notFound } from 'next/navigation'

export default async function ModificaCategoriaFornitorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const [query, contiCosti] = await Promise.all([
    searchParams,
    getContiCosti()
  ])
  const categoria = await getCategoriaFornitore(parseInt(id))

  if (!categoria) {
    notFound()
  }

  const updateWithId = async (formData: FormData) => {
    'use server'
    await updateCategoriaFornitore(categoria.id, formData)
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifica Categoria Fornitore</h1>
        <p className="text-sm text-gray-600 mt-1">
          Modifica la categoria &quot;{categoria.nome}&quot;
        </p>
      </div>

      {/* Form */}
      <CategoriaFornitoreForm
        categoria={categoria}
        contiCosti={contiCosti}
        action={updateWithId}
        error={query.error}
      />
    </div>
  )
}
