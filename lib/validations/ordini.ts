import { z } from 'zod'

export const ordineSchema = z.object({
  numero_ordine: z
    .string()
    .min(1, 'Numero ordine è obbligatorio')
    .max(50, 'Numero ordine troppo lungo'),

  tipo: z
    .enum(['vendita', 'acquisto'], {
      message: 'Tipo ordine deve essere vendita o acquisto'
    }),

  data_ordine: z
    .string()
    .min(1, 'Data ordine è obbligatoria'),

  cliente_id: z
    .string()
    .optional(),

  fornitore_id: z
    .string()
    .optional(),

  stato: z
    .string()
    .optional(),

  note: z
    .string()
    .optional(),
}).refine(
  (data) => {
    if (data.tipo === 'vendita') {
      return !!data.cliente_id
    } else if (data.tipo === 'acquisto') {
      return !!data.fornitore_id
    }
    return false
  },
  {
    message: 'Ordine di vendita richiede un cliente, ordine di acquisto richiede un fornitore',
    path: ['cliente_id'],
  }
)

export const dettaglioOrdineSchema = z.object({
  prodotto_id: z
    .string()
    .min(1, 'Prodotto è obbligatorio'),

  quantita: z
    .string()
    .refine((val) => !isNaN(parseInt(val)) && parseInt(val) > 0, 'Quantità deve essere maggiore di 0'),

  prezzo_unitario: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, 'Prezzo unitario deve essere maggiore di 0'),
})

export type OrdineInput = z.infer<typeof ordineSchema>
export type DettaglioOrdineInput = z.infer<typeof dettaglioOrdineSchema>

export function validateOrdineFormData(formData: FormData) {
  const data = {
    numero_ordine: formData.get('numero_ordine') as string,
    tipo: formData.get('tipo') as 'vendita' | 'acquisto',
    data_ordine: formData.get('data_ordine') as string,
    cliente_id: (formData.get('cliente_id') as string) || undefined,
    fornitore_id: (formData.get('fornitore_id') as string) || undefined,
    stato: (formData.get('stato') as string) || 'bozza',
    note: (formData.get('note') as string) || undefined,
  }

  return ordineSchema.safeParse(data)
}
