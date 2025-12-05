import { createMacrofamiglia } from '@/app/actions/macrofamiglie'
import MacrofamigliaForm from '@/components/MacrofamigliaForm'

export default function NuovaMacrofamigliaPage() {
  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Macrofamiglia</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova macrofamiglia
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <MacrofamigliaForm action={createMacrofamiglia} submitLabel="Crea Macrofamiglia" />
      </div>
    </div>
  )
}
