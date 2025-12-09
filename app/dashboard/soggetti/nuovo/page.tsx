import { getTipiSoggetto } from '@/app/actions/tipi-soggetto'
import { createSoggetto, getTrasportatori } from '@/app/actions/soggetti'
import { getAgentiAttivi } from '@/app/actions/agenti'
import { getCategorieClienteAttive } from '@/app/actions/categorie-cliente'
import { getCategorieFornitoreAttive } from '@/app/actions/categorie-fornitore'
import { getListiniAttivi } from '@/app/actions/listini'
import { getIncotermsAttivi } from '@/app/actions/incoterm'
import { getMetodiPagamentoAttivi } from '@/app/actions/metodi-pagamento'
import SoggettoForm from '@/components/SoggettoForm'

export default async function NuovoSoggettoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; return?: string; error?: string }>
}) {
  const [tipiSoggetto, agenti, trasportatori, incoterms, metodiPagamento, categorieCliente, categorieFornitore, listini] = await Promise.all([
    getTipiSoggetto(),
    getAgentiAttivi(),
    getTrasportatori(),
    getIncotermsAttivi(),
    getMetodiPagamentoAttivi(),
    getCategorieClienteAttive(),
    getCategorieFornitoreAttive(),
    getListiniAttivi('vendita')
  ])
  const params = await searchParams

  // Debug logging
  console.log('NuovoSoggettoPage Debug:', {
    'params.tipo': params.tipo,
    'tipiSoggetto.length': tipiSoggetto.length,
    'tipiSoggetto': tipiSoggetto.map(t => ({ id: t.id, codice: t.codice, nome: t.nome }))
  })

  // Pre-select tipo based on query param
  const tipoPreselezionato = params.tipo
    ? tipiSoggetto.find(t => t.codice === params.tipo)
    : undefined

  console.log('tipoPreselezionato:', tipoPreselezionato)

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Nuovo {tipoPreselezionato ? tipoPreselezionato.nome : 'Soggetto'}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Compila il form per aggiungere un nuovo {tipoPreselezionato ? tipoPreselezionato.nome.toLowerCase() : 'soggetto'}
        </p>
      </div>

      {/* Error Message */}
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{params.error}</p>
        </div>
      )}

      {/* Form */}
      <SoggettoForm
        tipiSoggetto={tipiSoggetto}
        tipoPreselezionato={tipoPreselezionato}
        agenti={agenti}
        trasportatori={trasportatori}
        incoterms={incoterms}
        metodiPagamento={metodiPagamento}
        categorieCliente={categorieCliente}
        categorieFornitore={categorieFornitore}
        listini={listini}
        returnUrl={params.return}
        action={createSoggetto}
        submitLabel="Crea Soggetto"
      />
    </div>
  )
}
