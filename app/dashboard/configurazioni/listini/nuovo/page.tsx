import { createListino } from '@/app/actions/listini'
import { getValute } from '@/app/actions/valute'
import { getSoggettiByTipoCodice } from '@/app/actions/soggetti'
import ListinoForm from '@/components/ListinoForm'
import Link from 'next/link'

export default async function NuovoListinoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; tipo?: string }>
}) {
  const params = await searchParams
  const tipoPreselezionato = params.tipo === 'vendita' || params.tipo === 'acquisto' ? params.tipo : undefined
  const [valute, fornitoriData] = await Promise.all([
    getValute(),
    getSoggettiByTipoCodice('FOR'),
  ])

  // Mappiamo i fornitori al formato atteso dal form
  const fornitori = fornitoriData.map((f) => ({
    id: f.id,
    ragione_sociale: f.ragione_sociale,
  }))

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/configurazioni" className="hover:text-gray-700">
            Configurazioni
          </Link>
          <span>/</span>
          <Link href="/dashboard/configurazioni/listini" className="hover:text-gray-700">
            Listini
          </Link>
          <span>/</span>
          <span className="text-gray-900">Nuovo</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Listino</h1>
        <p className="text-sm text-gray-600 mt-1">
          Crea un nuovo listino prezzi per vendita o acquisto
        </p>
      </div>

      {/* Form */}
      <ListinoForm
        valute={valute}
        fornitori={fornitori}
        action={createListino}
        error={params.error}
        tipoPreselezionato={tipoPreselezionato}
      />
    </div>
  )
}
