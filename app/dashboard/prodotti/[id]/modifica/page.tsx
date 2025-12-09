import { getProdotto, updateProdotto } from '@/app/actions/prodotti'
import { getFornitori } from '@/app/actions/fornitori'
import { getMacrofamiglie } from '@/app/actions/macrofamiglie'
import { getFamiglie } from '@/app/actions/famiglie'
import { getLinee } from '@/app/actions/linee'
import { getPrezziListinoProdotto, getListiniAttivi } from '@/app/actions/listini'
import ProdottoForm from '@/components/ProdottoForm'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function ModificaProdottoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  // Carica tutti i dati necessari in parallelo
  const [prodotto, fornitori, macrofamiglie, famiglie, linee, prezziListino, listini] = await Promise.all([
    getProdotto(id),
    getFornitori(),
    getMacrofamiglie(),
    getFamiglie(),
    getLinee(),
    getPrezziListinoProdotto(parseInt(id)),
    getListiniAttivi(),
  ])

  if (!prodotto) {
    redirect('/dashboard/prodotti?error=Prodotto non trovato')
  }

  const updateProdottoWithId = updateProdotto.bind(null, id)

  // Prepara listini per il componente
  const listiniDisponibili = listini.map(l => ({
    id: l.id,
    codice: l.codice,
    nome: l.nome,
    tipo: l.tipo as 'vendita' | 'acquisto',
  }))

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
          <h1 className="text-2xl font-bold text-gray-900">Modifica Prodotto</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        <ProdottoForm
          action={updateProdottoWithId}
          fornitori={fornitori}
          macrofamiglie={macrofamiglie}
          famiglie={famiglie}
          linee={linee}
          initialData={prodotto}
          submitLabel="Salva Modifiche"
          prezziListino={prezziListino}
          listiniDisponibili={listiniDisponibili}
        />
      </main>
    </div>
  )
}
