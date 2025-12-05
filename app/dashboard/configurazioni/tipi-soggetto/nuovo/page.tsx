import { createTipoSoggetto } from '@/app/actions/tipi-soggetto'
import TipoSoggettoForm from '@/components/TipoSoggettoForm'

export default function NuovoTipoSoggettoPage() {
  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Tipo Soggetto</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi un nuovo tipo di soggetto
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <TipoSoggettoForm action={createTipoSoggetto} submitLabel="Crea Tipo Soggetto" />
      </div>
    </div>
  )
}
