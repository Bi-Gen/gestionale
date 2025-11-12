import { z } from 'zod'

// Regex personalizzate per validazioni italiane
const partitaIVARegex = /^\d{11}$/
const codiceFiscaleRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i
const capRegex = /^\d{5}$/
const provinciaRegex = /^[A-Z]{2}$/i
const telefonoRegex = /^(\+39)?\s?[\d\s\-]{6,}$/

// Schema Zod per validazione Cliente
export const clienteSchema = z.object({
  ragione_sociale: z
    .string()
    .min(1, 'Ragione sociale è obbligatoria')
    .max(255, 'Ragione sociale troppo lunga'),

  partita_iva: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || partitaIVARegex.test(val),
      'Partita IVA non valida (deve essere di 11 cifre)'
    ),

  codice_fiscale: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || codiceFiscaleRegex.test(val),
      'Codice Fiscale non valido (formato: RSSMRA80A01H501U)'
    ),

  email: z
    .string()
    .email('Email non valida')
    .optional()
    .or(z.literal('')),

  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Telefono non valido (es. +39 123 4567890 o 0123456789)'
    ),

  indirizzo: z
    .string()
    .max(255, 'Indirizzo troppo lungo')
    .optional(),

  citta: z
    .string()
    .max(100, 'Nome città troppo lungo')
    .optional(),

  cap: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || capRegex.test(val),
      'CAP non valido (deve essere di 5 cifre, es. 20100)'
    ),

  provincia: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || provinciaRegex.test(val),
      'Provincia non valida (2 lettere maiuscole, es. MI)'
    ),

  note: z
    .string()
    .optional(),
})

// Tipo TypeScript inferito dallo schema
export type ClienteInput = z.infer<typeof clienteSchema>

// Funzione helper per validare i dati dal FormData
export function validateClienteFormData(formData: FormData) {
  const data = {
    ragione_sociale: formData.get('ragione_sociale') as string,
    partita_iva: (formData.get('partita_iva') as string) || undefined,
    codice_fiscale: (formData.get('codice_fiscale') as string) || undefined,
    email: (formData.get('email') as string) || undefined,
    telefono: (formData.get('telefono') as string) || undefined,
    indirizzo: (formData.get('indirizzo') as string) || undefined,
    citta: (formData.get('citta') as string) || undefined,
    cap: (formData.get('cap') as string) || undefined,
    provincia: (formData.get('provincia') as string)?.toUpperCase() || undefined,
    note: (formData.get('note') as string) || undefined,
  }

  return clienteSchema.safeParse(data)
}
