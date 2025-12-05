import { createCausaleMovimento } from '@/app/actions/causali-movimento'
import CausaleMovimentoForm from '@/components/CausaleMovimentoForm'

export default function NuovaCausaleMovimentoPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Causale Movimento</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova causale per i movimenti di magazzino
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <CausaleMovimentoForm action={createCausaleMovimento} submitLabel="Crea Causale" />
      </div>
    </div>
  )
}
