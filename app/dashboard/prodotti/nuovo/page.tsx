import { createProdotto } from '@/app/actions/prodotti'
import { getFornitori } from '@/app/actions/fornitori'
import ProdottoForm from '@/components/ProdottoForm'
import Link from 'next/link'

export default async function NuovoProdottoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const fornitori = await getFornitori()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/prodotti"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna ai Prodotti
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Prodotto</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <ProdottoForm action={createProdotto} fornitori={fornitori} submitLabel="Salva Prodotto" />
      </main>
    </div>
  )
}
