import { createCategoriaCliente } from '@/app/actions/categorie-cliente'
import { getListiniAttivi } from '@/app/actions/listini'
import CategoriaClienteForm from '@/components/CategoriaClienteForm'
import Link from 'next/link'

export default async function NuovaCategoriaClientePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const listini = await getListiniAttivi('vendita')

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
          <span className="text-gray-900">Nuova</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Nuova Categoria Cliente</h1>
        <p className="text-sm text-gray-600 mt-1">
          Crea una nuova categoria per classificare i clienti
        </p>
      </div>

      {/* Form */}
      <CategoriaClienteForm
        listini={listini}
        action={createCategoriaCliente}
        error={params.error}
      />
    </div>
  )
}
