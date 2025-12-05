import { getCausali, getMagazzini } from '@/app/actions/magazzino'
import { getProdotti } from '@/app/actions/prodotti'
import { createClient } from '@/lib/supabase/server'
import MovimentoFormAdvanced from '@/components/MovimentoFormAdvanced'

export default async function NuovoMovimentoPage() {
  const [causali, prodotti, magazzini] = await Promise.all([
    getCausali(),
    getProdotti(),
    getMagazzini(),
  ])

  // Recupera anche i soggetti (fornitori e clienti) con tipo array
  const supabase = await createClient()
  const { data: soggetti } = await supabase
    .from('soggetto')
    .select('id, ragione_sociale, tipo')
    .eq('attivo', true)
    .order('ragione_sociale', { ascending: true })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuovo Movimento</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registra un nuovo movimento di magazzino (carico, scarico, trasferimento, ecc.)
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <MovimentoFormAdvanced
            causali={causali}
            prodotti={prodotti.map(p => ({
              id: p.id,
              codice: p.codice,
              nome: p.nome,
            }))}
            magazzini={magazzini}
            soggetti={soggetti || []}
          />
        </div>
      </div>
    </div>
  )
}
