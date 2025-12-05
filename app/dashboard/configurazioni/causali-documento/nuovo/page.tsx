import { createCausaleDocumento } from '@/app/actions/causali-documento'
import CausaleDocumentoForm from '@/components/CausaleDocumentoForm'

export default function NuovaCausaleDocumentoPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Causale Documento</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi un nuovo tipo di documento
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <CausaleDocumentoForm action={createCausaleDocumento} submitLabel="Crea Causale" />
      </div>
    </div>
  )
}
