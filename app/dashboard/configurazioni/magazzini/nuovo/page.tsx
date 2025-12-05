import { createMagazzino } from '@/app/actions/magazzini'
import MagazzinoForm from '@/components/MagazzinoForm'

export default function NuovoMagazzinoPage() {
  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Magazzino</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi un nuovo magazzino o ubicazione di stoccaggio
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <MagazzinoForm action={createMagazzino} submitLabel="Crea Magazzino" />
      </div>
    </div>
  )
}
