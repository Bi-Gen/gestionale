import { z } from 'zod'

// Regex patterns
const partitaIVARegex = /^\d{11}$/
const codiceFiscaleRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/
const capRegex = /^\d{5}$/
const provinciaRegex = /^[A-Z]{2}$/
const telefonoRegex = /^(\+39)?\s?[\d\s\-]{6,}$/
const ibanRegex = /^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/ // IBAN italiano
const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/ // BIC/SWIFT
const codiceUnivocoRegex = /^[A-Z0-9]{7}$/ // Codice SDI
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/

export const fornitoreSchema = z.object({
  // === DATI ANAGRAFICI ===
  tipo_persona: z.enum(['fisica', 'giuridica']).default('giuridica'),

  ragione_sociale: z
    .string()
    .min(1, 'Ragione sociale è obbligatoria')
    .max(255, 'Ragione sociale troppo lunga'),

  // === DATI FISCALI ===
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

  codice_univoco: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || codiceUnivocoRegex.test(val),
      'Codice Univoco SDI non valido (7 caratteri alfanumerici)'
    ),

  pec: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || emailRegex.test(val),
      'Email PEC non valida'
    ),

  // === CONTATTI ===
  email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || emailRegex.test(val),
      'Email non valida'
    ),

  telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Telefono non valido'
    ),

  cellulare: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Cellulare non valido'
    ),

  sito_web: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || urlRegex.test(val),
      'URL sito web non valido'
    ),

  // === INDIRIZZO ===
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
      'CAP non valido (deve essere di 5 cifre)'
    ),

  provincia: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || provinciaRegex.test(val),
      'Provincia non valida (2 lettere maiuscole)'
    ),

  paese: z
    .string()
    .length(2, 'Codice paese deve essere di 2 lettere')
    .default('IT'),

  // === DATI COMMERCIALI FORNITORE ===
  categoria_fornitore_id: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : null),

  giorni_consegna: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(Number(val)) && Number(val) >= 0),
      'Giorni consegna deve essere un numero positivo'
    ),

  sconto_fornitore: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100),
      'Sconto deve essere tra 0 e 100'
    ),

  // === DATI PAGAMENTO ===
  giorni_pagamento: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(Number(val)) && Number(val) >= 0),
      'Giorni pagamento deve essere un numero positivo'
    ),

  iban: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || ibanRegex.test(val.replace(/\s/g, '')),
      'IBAN non valido (formato italiano: IT + 27 caratteri)'
    ),

  banca: z
    .string()
    .max(255)
    .optional(),

  swift_bic: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || swiftRegex.test(val),
      'Codice SWIFT/BIC non valido (8-11 caratteri)'
    ),

  // === REFERENTE ===
  referente: z
    .string()
    .max(255)
    .optional(),

  referente_telefono: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || telefonoRegex.test(val),
      'Telefono referente non valido'
    ),

  referente_email: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || emailRegex.test(val),
      'Email referente non valida'
    ),

  // === NOTE ===
  note: z
    .string()
    .optional(),

  // === GEOGRAFICI ===
  comune_id: z
    .string()
    .optional()
    .transform(val => val ? parseInt(val, 10) : null),

  // === VALUTA E IVA ===
  valuta: z
    .string()
    .length(3, 'Codice valuta deve essere di 3 lettere (es: EUR, USD)')
    .regex(/^[A-Z]{3}$/, 'Codice valuta non valido (es: EUR, USD)')
    .default('EUR'),

  aliquota_iva: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Aliquota IVA deve essere tra 0 e 100'
    ),
})

export type FornitoreInput = z.infer<typeof fornitoreSchema>

export function validateFornitoreFormData(formData: FormData) {
  const data = {
    // Anagrafica
    tipo_persona: (formData.get('tipo_persona') as string) || 'giuridica',
    ragione_sociale: formData.get('ragione_sociale') as string,

    // Dati fiscali
    partita_iva: (formData.get('partita_iva') as string) || undefined,
    codice_fiscale: (formData.get('codice_fiscale') as string)?.toUpperCase() || undefined,
    codice_univoco: (formData.get('codice_univoco') as string)?.toUpperCase() || undefined,
    pec: (formData.get('pec') as string) || undefined,

    // Contatti
    email: (formData.get('email') as string) || undefined,
    telefono: (formData.get('telefono') as string) || undefined,
    cellulare: (formData.get('cellulare') as string) || undefined,
    sito_web: (formData.get('sito_web') as string) || undefined,

    // Indirizzo
    indirizzo: (formData.get('indirizzo') as string) || undefined,
    citta: (formData.get('citta') as string) || undefined,
    cap: (formData.get('cap') as string) || undefined,
    provincia: (formData.get('provincia') as string)?.toUpperCase() || undefined,
    paese: (formData.get('paese') as string) || 'IT',

    // Commerciali
    categoria_fornitore_id: (formData.get('categoria_fornitore_id') as string) || undefined,
    giorni_consegna: (formData.get('giorni_consegna') as string) || undefined,
    sconto_fornitore: (formData.get('sconto_fornitore') as string) || undefined,

    // Pagamenti
    giorni_pagamento: (formData.get('giorni_pagamento') as string) || undefined,
    iban: (formData.get('iban') as string)?.toUpperCase().replace(/\s/g, '') || undefined,
    banca: (formData.get('banca') as string) || undefined,
    swift_bic: (formData.get('swift_bic') as string)?.toUpperCase() || undefined,

    // Referente
    referente: (formData.get('referente') as string) || undefined,
    referente_telefono: (formData.get('referente_telefono') as string) || undefined,
    referente_email: (formData.get('referente_email') as string) || undefined,

    // Note
    note: (formData.get('note') as string) || undefined,

    // Geografici
    comune_id: (formData.get('comune_id') as string) || undefined,

    // Valuta e IVA
    valuta: (formData.get('valuta') as string)?.toUpperCase() || 'EUR',
    aliquota_iva: (formData.get('aliquota_iva') as string) || undefined,
  }

  return fornitoreSchema.safeParse(data)
}
