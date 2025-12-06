import { createLinea } from '@/app/actions/linee'
import LineaForm from '@/components/LineaForm'

export default async function NuovaLineaPage() {
  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Linea Prodotto</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova linea prodotto
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <LineaForm
          action={createLinea}
          submitLabel="Crea Linea"
        />
      </div>
    </div>
  )
}
