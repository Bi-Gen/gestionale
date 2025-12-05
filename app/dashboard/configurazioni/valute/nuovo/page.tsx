import { createValuta } from '@/app/actions/valute'
import ValutaForm from '@/components/ValutaForm'

export default function NuovaValutaPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Valuta</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova valuta con il tasso di cambio
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <ValutaForm action={createValuta} submitLabel="Crea Valuta" />
      </div>
    </div>
  )
}
