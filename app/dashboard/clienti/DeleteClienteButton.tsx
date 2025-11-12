'use client'

import { deleteCliente } from '@/app/actions/clienti'

export default function DeleteClienteButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (confirm('Sei sicuro di voler eliminare questo cliente?')) {
      await deleteCliente(id)
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
    >
      Elimina
    </button>
  )
}
