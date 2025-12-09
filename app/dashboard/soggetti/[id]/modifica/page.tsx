import { getSoggetto, updateSoggetto, getTrasportatori } from '@/app/actions/soggetti'
import { getTipiSoggetto } from '@/app/actions/tipi-soggetto'
import { getAgentiAttivi } from '@/app/actions/agenti'
import { getCategorieClienteAttive } from '@/app/actions/categorie-cliente'
import { getCategorieFornitoreAttive } from '@/app/actions/categorie-fornitore'
import { getListiniAttivi } from '@/app/actions/listini'
import { getIncotermsAttivi } from '@/app/actions/incoterm'
import SoggettoForm from '@/components/SoggettoForm'
import { notFound } from 'next/navigation'

export default async function ModificaSoggettoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tipo?: string; return?: string; error?: string }>
}) {
  const { id } = await params
  const searchParamsResolved = await searchParams

  const [soggetto, tipiSoggetto, agenti, trasportatori, incoterms, categorieCliente, categorieFornitore, listini] = await Promise.all([
    getSoggetto(parseInt(id)),
    getTipiSoggetto(),
    getAgentiAttivi(),
    getTrasportatori(),
    getIncotermsAttivi(),
    getCategorieClienteAttive(),
    getCategorieFornitoreAttive(),
    getListiniAttivi('vendita')
  ])

  if (!soggetto) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Modifica Soggetto</h1>
        <p className="text-sm text-gray-600 mt-1">
          Modifica: {soggetto.ragione_sociale}
        </p>
      </div>

      {/* Error Message */}
      {searchParamsResolved.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{searchParamsResolved.error}</p>
        </div>
      )}

      {/* Form */}
      <SoggettoForm
        soggetto={soggetto}
        tipiSoggetto={tipiSoggetto}
        agenti={agenti}
        trasportatori={trasportatori}
        incoterms={incoterms}
        categorieCliente={categorieCliente}
        categorieFornitore={categorieFornitore}
        listini={listini}
        returnUrl={searchParamsResolved.return}
        action={updateSoggetto.bind(null, soggetto.id)}
        submitLabel="Salva Modifiche"
      />
    </div>
  )
}
