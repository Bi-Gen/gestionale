// Tipi costo per analisi fornitori
export const TIPI_COSTO = [
  { value: 'merce', label: 'Merce (COGS)', descrizione: 'Costi diretti della merce venduta' },
  { value: 'servizi', label: 'Servizi', descrizione: 'Consulenze, manutenzioni, etc.' },
  { value: 'trasporti', label: 'Trasporti', descrizione: 'Spedizioni, vettori, logistica' },
  { value: 'utility', label: 'Utility', descrizione: 'Energia, acqua, gas, telefono' },
  { value: 'finanziari', label: 'Finanziari', descrizione: 'Banche, interessi, commissioni' },
  { value: 'altro', label: 'Altro', descrizione: 'Altri costi non classificati' },
] as const

export type TipoCosto = typeof TIPI_COSTO[number]['value']
