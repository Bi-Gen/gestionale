import { z } from 'zod'

// ===========================
// REGEX VALIDAZIONI
// ===========================
const partitaIVARegex = /^\d{11}$/
const codiceFiscaleRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i
const capRegex = /^\d{5}$/
const provinciaRegex = /^[A-Z]{2}$/i
const telefonoRegex = /^(\+39)?\s?[\d\s\-]{6,}$/
const codiceAgenteRegex = /^AG\d{3,}$/
const codiceUnivocoRegex = /^[A-Z0-9]{7}$/i
const ibanRegex = /^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/i
const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i

// ===========================
// SCHEMA ZOD AGENTE COMPLETO
// ===========================
export const agenteSchema = z.object({
  // === IDENTIFICAZIONE ===
  codice_agente: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || codiceAgenteRegex.test(val),
      'Codice agente non valido (formato: AG001, AG002, ...)'
    ),

  // === DATI ANAGRAFICI ===
  tipo_persona: z
    .enum(['fisica', 'giuridica'], {
      required_error: 'Tipo persona è obbligatorio',
      invalid_type_error: 'Tipo persona non valido'
    })
    .default('giuridica'),

  ragione_sociale: z
    .string()
    .min(1, 'Ragione sociale è obbligatoria')
    .max(255, 'Ragione sociale troppo lunga'),

  nome: z
    .string()
    .max(100, 'Nome troppo lungo')
    .optional(),

  cognome: z
    .string()
    .max(100, 'Cognome troppo lungo')
    .optional(),

  // === DATI FISCALI ===
  partita_iva: z
    .string()
    .min(1, 'Partita IVA è obbligatoria per gli agenti')
    .refine(
      (val) => partitaIVARegex.test(val),
      'Partita IVA non valida (deve essere di 11 cifre)'
    ),

  codice_fiscale: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || codiceFiscaleRegex.test(val),
      'Codice Fiscale non valido (formato: RSSMRA80A01H501U)'
    ),

  codice_univoco: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || codiceUnivocoRegex.test(val),
      'Codice Univoco SDI non valido (7 caratteri alfanumerici)'
    ),

  pec: z
    .string()
    .email('PEC non valida')
    .optional()
    .or(z.literal('')),

  // === CONTATTI ===
  email: z
    .string()
    .email('Email non valida')
    .optional()
    .or(z.literal('')),

  sito_web: z
    .string()
    .url('URL sito web non valido')
    .optional()
    .or(z.literal('')),

  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Telefono non valido (es. +39 123 4567890 o 0123456789)'
    ),

  cellulare: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Cellulare non valido (es. +39 123 4567890 o 0123456789)'
    ),

  fax: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Fax non valido (es. +39 123 4567890 o 0123456789)'
    ),

  // === INDIRIZZO ===
  indirizzo: z
    .string()
    .max(255, 'Indirizzo troppo lungo')
    .optional(),

  civico: z
    .string()
    .max(10, 'Numero civico troppo lungo')
    .optional(),

  comune_id: z
    .string()
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

  paese: z
    .string()
    .length(2, 'Codice paese deve essere di 2 lettere (es. IT)')
    .optional(),

  // === DATI AGENTE ===
  area_geografica: z
    .string()
    .max(100, 'Area geografica troppo lunga')
    .optional(),

  provvigione_percentuale: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Provvigione deve essere tra 0 e 100'
    ),

  attivo_come_agente: z
    .boolean()
    .default(true),

  // === PAGAMENTI ===
  giorni_pagamento: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || !isNaN(parseInt(val)),
      'Giorni pagamento non valido'
    ),

  banca: z
    .string()
    .max(255, 'Nome banca troppo lungo')
    .optional(),

  iban: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || ibanRegex.test(val),
      'IBAN non valido (es. IT60X0542811101000000123456)'
    ),

  swift_bic: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || swiftRegex.test(val),
      'SWIFT/BIC non valido (es. BPMOIT22XXX)'
    ),

  // === NOTE ===
  note: z
    .string()
    .optional(),
})

// Tipo TypeScript inferito dallo schema
export type AgenteInput = z.infer<typeof agenteSchema>

// ===========================
// FUNZIONE VALIDAZIONE FORMDATA
// ===========================
export function validateAgenteFormData(formData: FormData) {
  const data = {
    // Identificazione
    codice_agente: (formData.get('codice_agente') as string) || undefined,

    // Dati Anagrafici
    tipo_persona: (formData.get('tipo_persona') as string) || 'giuridica',
    ragione_sociale: formData.get('ragione_sociale') as string,
    nome: (formData.get('nome') as string) || undefined,
    cognome: (formData.get('cognome') as string) || undefined,

    // Dati Fiscali
    partita_iva: (formData.get('partita_iva') as string) || undefined,
    codice_fiscale: (formData.get('codice_fiscale') as string) || undefined,
    codice_univoco: (formData.get('codice_univoco') as string) || undefined,
    pec: (formData.get('pec') as string) || undefined,

    // Contatti
    email: (formData.get('email') as string) || undefined,
    sito_web: (formData.get('sito_web') as string) || undefined,
    telefono: (formData.get('telefono') as string) || undefined,
    cellulare: (formData.get('cellulare') as string) || undefined,
    fax: (formData.get('fax') as string) || undefined,

    // Indirizzo
    indirizzo: (formData.get('indirizzo') as string) || undefined,
    civico: (formData.get('civico') as string) || undefined,
    comune_id: (formData.get('comune_id') as string) || undefined,
    citta: (formData.get('citta') as string) || undefined,
    cap: (formData.get('cap') as string) || undefined,
    provincia: (formData.get('provincia') as string)?.toUpperCase() || undefined,
    paese: (formData.get('paese') as string)?.toUpperCase() || undefined,

    // Dati Agente
    area_geografica: (formData.get('area_geografica') as string) || undefined,
    provvigione_percentuale: (formData.get('provvigione_percentuale') as string) || undefined,
    attivo_come_agente: formData.get('attivo_come_agente') === 'true',

    // Pagamenti
    giorni_pagamento: (formData.get('giorni_pagamento') as string) || undefined,
    banca: (formData.get('banca') as string) || undefined,
    iban: (formData.get('iban') as string)?.toUpperCase() || undefined,
    swift_bic: (formData.get('swift_bic') as string)?.toUpperCase() || undefined,

    // Note
    note: (formData.get('note') as string) || undefined,
  }

  return agenteSchema.safeParse(data)
}
