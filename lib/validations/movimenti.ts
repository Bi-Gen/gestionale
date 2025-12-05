import { z } from 'zod'

export const movimentoSchema = z.object({
  causale_codice: z.string().min(1, 'Seleziona una causale'),
  prodotto_id: z.coerce.number().positive('Seleziona un prodotto'),
  magazzino_id: z.coerce.number().positive('Seleziona un magazzino'),
  quantita: z.coerce.number().positive('La quantità deve essere maggiore di zero'),
  data_movimento: z.string().min(1, 'Inserisci la data del movimento'),
  costo_unitario: z.coerce.number().positive().optional(),
  magazzino_destinazione_id: z.coerce.number().positive().optional(),
  soggetto_id: z.coerce.number().positive().optional(),
  note: z.string().optional(),
})

export type MovimentoFormData = z.infer<typeof movimentoSchema>
