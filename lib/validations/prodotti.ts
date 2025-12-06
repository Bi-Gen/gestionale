import { z } from 'zod'

// Regex patterns
const eanRegex = /^\d{8}$|^\d{13}$/  // EAN8 o EAN13
const decimalRegex = /^\d+(\.\d{1,2})?$/  // Decimali con max 2 cifre

export const prodottoSchema = z.object({
  // === IDENTIFICAZIONE ===
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

  descrizione_breve: z
    .string()
    .max(500, 'Descrizione breve troppo lunga')
    .optional(),

  codice_ean: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || eanRegex.test(val),
      'Codice EAN non valido (8 o 13 cifre)'
    ),

  codice_fornitore: z
    .string()
    .max(100, 'Codice fornitore troppo lungo')
    .optional(),

  codice_doganale: z
    .string()
    .max(20, 'Codice doganale troppo lungo')
    .optional(),

  riferimento: z
    .string()
    .max(50, 'Riferimento troppo lungo')
    .optional(),

  ean_proprietario: z
    .string()
    .max(100, 'Proprietario EAN troppo lungo')
    .optional(),

  sku: z
    .string()
    .max(100, 'SKU troppo lungo')
    .optional(),

  // === CLASSIFICAZIONE (solo FK, no campi stringa) ===
  macrofamiglia_id: z
    .string()
    .optional(),

  famiglia_id: z
    .string()
    .optional(),

  linea_id: z
    .string()
    .optional(),

  misura: z
    .string()
    .max(50, 'Misura troppo lunga')
    .optional(),

  // === PREZZI E COSTI ===
  costo_ultimo: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Costo ultimo deve essere un numero positivo'
    ),

  costo_medio: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Costo medio deve essere un numero positivo'
    ),

  prezzo_acquisto: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Prezzo acquisto deve essere un numero positivo'
    ),

  prezzo_vendita: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Prezzo vendita è obbligatorio e deve essere un numero positivo'),


  margine_percentuale: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Margine deve essere tra 0 e 100'
    ),

  sconto_massimo: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Sconto massimo deve essere tra 0 e 100'
    ),

  aliquota_iva: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100),
      'Aliquota IVA deve essere tra 0 e 100'
    ),

  valuta: z
    .string()
    .length(3, 'Codice valuta deve essere di 3 lettere (es: EUR, USD)')
    .regex(/^[A-Z]{3}$/, 'Codice valuta non valido (es: EUR, USD)')
    .default('EUR'),

  // === FORNITORE ===
  fornitore_principale_id: z
    .string()
    .optional(),

  tempo_riordino_giorni: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      'Tempo riordino deve essere un numero positivo'
    ),

  transit_time_giorni: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      'Transit time deve essere un numero positivo'
    ),

  quantita_minima_ordine: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
      'Quantità minima ordine deve essere un numero positivo'
    ),

  // === MAGAZZINO ===
  unita_misura: z
    .string()
    .optional(),

  quantita_magazzino: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Quantità magazzino non valida'
    ),

  giacenza_minima: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Giacenza minima non valida'
    ),

  giacenza_massima: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Giacenza massima non valida'
    ),

  punto_riordino: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Punto riordino non valido'
    ),

  ubicazione: z
    .string()
    .max(50, 'Ubicazione troppo lunga')
    .optional(),

  // === MISURE E DIMENSIONI ===
  peso_kg: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Peso deve essere un numero positivo'
    ),

  volume_m3: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Volume deve essere un numero positivo'
    ),

  lunghezza_cm: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Lunghezza deve essere un numero positivo'
    ),

  larghezza_cm: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Larghezza deve essere un numero positivo'
    ),

  altezza_cm: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
      'Altezza deve essere un numero positivo'
    ),

  colli: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
      'Numero colli deve essere almeno 1'
    ),

  // === GESTIONE AVANZATA ===
  gestione_lotti: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  gestione_seriali: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  gestione_scadenze: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  giorni_scadenza: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
      'Giorni scadenza deve essere almeno 1'
    ),

  // === VENDITA ===
  vendibile: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  acquistabile: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  visibile_catalogo: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  visibile_ecommerce: z
    .string()
    .optional()
    .transform(val => val === 'true' || val === 'on'),

  // === NOTE ===
  note: z
    .string()
    .optional(),

  note_interne: z
    .string()
    .optional(),

  immagine_url: z
    .string()
    .url('URL immagine non valido')
    .optional()
    .or(z.literal('')),

  // === PACKAGING ===
  pkg_nome_confezione: z.string().max(50).optional(),
  pkg_pezzi_per_confezione: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Pezzi per confezione deve essere almeno 1'
  ),
  pkg_confezione_peso_kg: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Peso confezione non valido'
  ),
  pkg_confezioni_per_cartone: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Confezioni per cartone deve essere almeno 1'
  ),
  pkg_cartone_lunghezza_cm: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Lunghezza cartone non valida'
  ),
  pkg_cartone_larghezza_cm: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Larghezza cartone non valida'
  ),
  pkg_cartone_altezza_cm: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Altezza cartone non valida'
  ),
  pkg_cartone_peso_kg: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
    'Peso cartone non valido'
  ),
  pkg_cartoni_per_pallet: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Cartoni per pallet deve essere almeno 1'
  ),
  pkg_cartoni_per_strato: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Cartoni per strato deve essere almeno 1'
  ),
  pkg_strati_per_pallet: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Strati per pallet deve essere almeno 1'
  ),
  pkg_pallet_per_container_20ft: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Pallet per container 20ft deve essere almeno 1'
  ),
  pkg_pallet_per_container_40ft: z.string().optional().refine(
    (val) => !val || val.length === 0 || (!isNaN(parseInt(val)) && parseInt(val) >= 1),
    'Pallet per container 40ft deve essere almeno 1'
  ),
})

export type ProdottoInput = z.infer<typeof prodottoSchema>

export function validateProdottoFormData(formData: FormData) {
  const data = {
    // Identificazione
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: (formData.get('descrizione') as string) || undefined,
    descrizione_breve: (formData.get('descrizione_breve') as string) || undefined,
    codice_ean: (formData.get('codice_ean') as string) || undefined,
    codice_fornitore: (formData.get('codice_fornitore') as string) || undefined,
    codice_doganale: (formData.get('codice_doganale') as string) || undefined,
    riferimento: (formData.get('riferimento') as string) || undefined,
    ean_proprietario: (formData.get('ean_proprietario') as string) || undefined,
    sku: (formData.get('sku') as string) || undefined,

    // Classificazione (solo FK)
    macrofamiglia_id: (formData.get('macrofamiglia_id') as string) || undefined,
    famiglia_id: (formData.get('famiglia_id') as string) || undefined,
    linea_id: (formData.get('linea_id') as string) || undefined,
    misura: (formData.get('misura') as string) || undefined,

    // Prezzi e costi
    costo_ultimo: (formData.get('costo_ultimo') as string) || undefined,
    costo_medio: (formData.get('costo_medio') as string) || undefined,
    prezzo_acquisto: (formData.get('prezzo_acquisto') as string) || undefined,
    prezzo_vendita: formData.get('prezzo_vendita') as string,
    margine_percentuale: (formData.get('margine_percentuale') as string) || undefined,
    sconto_massimo: (formData.get('sconto_massimo') as string) || undefined,
    aliquota_iva: (formData.get('aliquota_iva') as string) || undefined,
    valuta: (formData.get('valuta') as string)?.toUpperCase() || 'EUR',

    // Fornitore
    fornitore_principale_id: (formData.get('fornitore_principale_id') as string) || undefined,
    tempo_riordino_giorni: (formData.get('tempo_riordino_giorni') as string) || undefined,
    transit_time_giorni: (formData.get('transit_time_giorni') as string) || undefined,
    quantita_minima_ordine: (formData.get('quantita_minima_ordine') as string) || undefined,

    // Magazzino
    unita_misura: (formData.get('unita_misura') as string) || undefined,
    quantita_magazzino: (formData.get('quantita_magazzino') as string) || undefined,
    giacenza_minima: (formData.get('giacenza_minima') as string) || undefined,
    giacenza_massima: (formData.get('giacenza_massima') as string) || undefined,
    punto_riordino: (formData.get('punto_riordino') as string) || undefined,
    ubicazione: (formData.get('ubicazione') as string) || undefined,

    // Misure e dimensioni
    peso_kg: (formData.get('peso_kg') as string) || undefined,
    volume_m3: (formData.get('volume_m3') as string) || undefined,
    lunghezza_cm: (formData.get('lunghezza_cm') as string) || undefined,
    larghezza_cm: (formData.get('larghezza_cm') as string) || undefined,
    altezza_cm: (formData.get('altezza_cm') as string) || undefined,
    colli: (formData.get('colli') as string) || undefined,

    // Gestione avanzata
    gestione_lotti: (formData.get('gestione_lotti') as string) || undefined,
    gestione_seriali: (formData.get('gestione_seriali') as string) || undefined,
    gestione_scadenze: (formData.get('gestione_scadenze') as string) || undefined,
    giorni_scadenza: (formData.get('giorni_scadenza') as string) || undefined,

    // Vendita
    vendibile: (formData.get('vendibile') as string) || undefined,
    acquistabile: (formData.get('acquistabile') as string) || undefined,
    visibile_catalogo: (formData.get('visibile_catalogo') as string) || undefined,
    visibile_ecommerce: (formData.get('visibile_ecommerce') as string) || undefined,

    // Note
    note: (formData.get('note') as string) || undefined,
    note_interne: (formData.get('note_interne') as string) || undefined,
    immagine_url: (formData.get('immagine_url') as string) || undefined,

    // Packaging
    pkg_nome_confezione: (formData.get('pkg_nome_confezione') as string) || undefined,
    pkg_pezzi_per_confezione: (formData.get('pkg_pezzi_per_confezione') as string) || undefined,
    pkg_confezione_peso_kg: (formData.get('pkg_confezione_peso_kg') as string) || undefined,
    pkg_confezioni_per_cartone: (formData.get('pkg_confezioni_per_cartone') as string) || undefined,
    pkg_cartone_lunghezza_cm: (formData.get('pkg_cartone_lunghezza_cm') as string) || undefined,
    pkg_cartone_larghezza_cm: (formData.get('pkg_cartone_larghezza_cm') as string) || undefined,
    pkg_cartone_altezza_cm: (formData.get('pkg_cartone_altezza_cm') as string) || undefined,
    pkg_cartone_peso_kg: (formData.get('pkg_cartone_peso_kg') as string) || undefined,
    pkg_cartoni_per_pallet: (formData.get('pkg_cartoni_per_pallet') as string) || undefined,
    pkg_cartoni_per_strato: (formData.get('pkg_cartoni_per_strato') as string) || undefined,
    pkg_strati_per_pallet: (formData.get('pkg_strati_per_pallet') as string) || undefined,
    pkg_pallet_per_container_20ft: (formData.get('pkg_pallet_per_container_20ft') as string) || undefined,
    pkg_pallet_per_container_40ft: (formData.get('pkg_pallet_per_container_40ft') as string) || undefined,
  }

  return prodottoSchema.safeParse(data)
}
