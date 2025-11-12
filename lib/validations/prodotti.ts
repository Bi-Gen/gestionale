import { z } from 'zod'

export const prodottoSchema = z.object({
  codice: z
    .string()
    .min(1, 'Codice prodotto è obbligatorio')
    .max(50, 'Codice prodotto troppo lungo'),

  nome: z
    .string()
    .min(1, 'Nome prodotto è obbligatorio')
    .max(255, 'Nome prodotto troppo lungo'),

  descrizione: z
    .string()
    .optional(),

  prezzo_acquisto: z
    .string()
    .optional()
    .refine(
      (val) => !val || !isNaN(parseFloat(val)),
      'Prezzo acquisto non valido'
    ),

  prezzo_vendita: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)), 'Prezzo vendita è obbligatorio e deve essere un numero'),

  quantita_magazzino: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      'Quantità magazzino non valida'
    ),

  unita_misura: z
    .string()
    .optional(),

  fornitore_id: z
    .string()
    .optional(),

  categoria: z
    .string()
    .max(100, 'Categoria troppo lunga')
    .optional(),

  note: z
    .string()
    .optional(),
})

export type ProdottoInput = z.infer<typeof prodottoSchema>

export function validateProdottoFormData(formData: FormData) {
  const data = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: (formData.get('descrizione') as string) || undefined,
    prezzo_acquisto: (formData.get('prezzo_acquisto') as string) || undefined,
    prezzo_vendita: formData.get('prezzo_vendita') as string,
    quantita_magazzino: (formData.get('quantita_magazzino') as string) || undefined,
    unita_misura: (formData.get('unita_misura') as string) || undefined,
    fornitore_id: (formData.get('fornitore_id') as string) || undefined,
    categoria: (formData.get('categoria') as string) || undefined,
    note: (formData.get('note') as string) || undefined,
  }

  return prodottoSchema.safeParse(data)
}
