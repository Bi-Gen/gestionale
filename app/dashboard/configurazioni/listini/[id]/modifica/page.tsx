import { getListino, updateListino } from '@/app/actions/listini'
import { getValute } from '@/app/actions/valute'
import { getSoggettiByTipoCodice } from '@/app/actions/soggetti'
import ListinoForm from '@/components/ListinoForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function ModificaListinoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const search = await searchParams
  const listinoId = parseInt(id)

  const [listino, valute, fornitoriData] = await Promise.all([
    getListino(listinoId),
    getValute(),
    getSoggettiByTipoCodice('FOR'),
  ])

  if (!listino) {
    notFound()
  }

  // Mappiamo i fornitori al formato atteso dal form
  const fornitori = fornitoriData.map((f) => ({
    id: f.id,
    ragione_sociale: f.ragione_sociale,
  }))

  // Server action wrapper per passare l'id
  async function updateListinoAction(formData: FormData) {
    'use server'
    await updateListino(listinoId, formData)
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
          <Link href="/dashboard/configurazioni/listini" className="hover:text-gray-700">
            Listini
          </Link>
          <span>/</span>
          <span className="text-gray-900">Modifica</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">
          Modifica Listino: {listino.codice}
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          {listino.nome}
        </p>
      </div>

      {/* Form */}
      <ListinoForm
        listino={listino}
        valute={valute}
        fornitori={fornitori}
        action={updateListinoAction}
        error={search.error}
      />
    </div>
  )
}
