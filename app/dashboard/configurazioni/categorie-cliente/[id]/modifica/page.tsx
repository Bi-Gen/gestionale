import { getCategoriaCliente, updateCategoriaCliente } from '@/app/actions/categorie-cliente'
import { getListiniAttivi } from '@/app/actions/listini'
import CategoriaClienteForm from '@/components/CategoriaClienteForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ModificaCategoriaClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const search = await searchParams
  const categoriaId = parseInt(id)

  const [categoria, listini] = await Promise.all([
    getCategoriaCliente(categoriaId),
    getListiniAttivi('vendita'),
  ])

  if (!categoria) {
    notFound()
  }

  async function updateCategoriaAction(formData: FormData) {
    'use server'
    await updateCategoriaCliente(categoriaId, formData)
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/configurazioni" className="hover:text-gray-700">
            Configurazioni
          </Link>
          <span>/</span>
          <Link href="/dashboard/configurazioni/categorie-cliente" className="hover:text-gray-700">
            Categorie Cliente
          </Link>
          <span>/</span>
          <span className="text-gray-900">Modifica</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Categoria: {categoria.codice}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {categoria.nome}
        </p>
      </div>

      {/* Form */}
      <CategoriaClienteForm
        categoria={categoria}
        listini={listini}
        action={updateCategoriaAction}
        error={search.error}
      />
    </div>
  )
}
