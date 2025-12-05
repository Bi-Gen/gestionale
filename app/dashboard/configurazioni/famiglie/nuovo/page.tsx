import { createFamiglia } from '@/app/actions/famiglie'
import { getMacrofamiglie } from '@/app/actions/macrofamiglie'
import FamigliaForm from '@/components/FamigliaForm'

export default async function NuovaFamigliaPage() {
  const macrofamiglie = await getMacrofamiglie()

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Famiglia</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova famiglia
        </p>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <FamigliaForm
          macrofamiglie={macrofamiglie}
          action={createFamiglia}
          submitLabel="Crea Famiglia"
        />
      </div>
    </div>
  )
}
