import { createAliquotaIva } from '@/app/actions/aliquote-iva'
import AliquotaIvaForm from '@/components/AliquotaIvaForm'

export default function NuovaAliquotaIvaPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuova Aliquota IVA</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi una nuova aliquota IVA
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <AliquotaIvaForm action={createAliquotaIva} submitLabel="Crea Aliquota" />
      </div>
    </div>
  )
}
