import { createMetodoPagamento } from '@/app/actions/metodi-pagamento'
import MetodoPagamentoForm from '@/components/MetodoPagamentoForm'

export default function NuovoMetodoPagamentoPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Metodo Pagamento</h1>
        <p className="text-sm text-gray-600 mt-1">
          Aggiungi un nuovo metodo di pagamento
        </p>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <MetodoPagamentoForm action={createMetodoPagamento} submitLabel="Crea Metodo" />
      </div>
    </div>
  )
}
