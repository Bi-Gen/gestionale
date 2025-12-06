'use client'

import { useState } from 'react'
import Link from 'next/link'

// Props del componente semplificato - link a form esistente
export type SelectConCreazioneProps<T> = {
  // Configurazione base
  name: string                    // nome del campo per il form
  label: string                   // etichetta visualizzata
  entityName: string              // es: "Macrofamiglia", "Categoria Cliente"

  // Dati
  options: T[]                    // lista opzioni esistenti
  valueField: keyof T             // campo da usare come value (es: "id")
  displayField: keyof T           // campo da visualizzare (es: "nome")

  // Stato
  value?: string | number         // valore selezionato
  onChange?: (value: string | number | undefined) => void
  defaultValue?: string | number

  // Link al form di creazione
  createUrl: string               // URL del form di creazione

  // Opzioni UI
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
  className?: string

  // Dipendenze (per filtri a cascata)
  parentValue?: string | number   // valore del parent (es: macrofamiglia_id per famiglia)
  filterFn?: (option: T, parentValue: string | number) => boolean  // funzione filtro
}

export default function SelectConCreazione<T extends Record<string, unknown>>({
  name,
  label,
  entityName,
  options,
  valueField,
  displayField,
  value,
  onChange,
  defaultValue,
  createUrl,
  required = false,
  disabled = false,
  placeholder = 'Seleziona...',
  helpText,
  className = '',
  parentValue,
  filterFn,
}: SelectConCreazioneProps<T>) {
  const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value ?? defaultValue)

  // Filtra opzioni se c'è un parent
  const filteredOptions = filterFn && parentValue
    ? options.filter(opt => filterFn(opt, parentValue))
    : options

  // Gestione cambio selezione
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value ? (typeof defaultValue === 'number' ? parseInt(e.target.value) : e.target.value) : undefined
    setSelectedValue(newValue)
    onChange?.(newValue)
  }

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="mt-1 flex gap-2">
        {/* Select */}
        <select
          name={name}
          id={name}
          value={selectedValue ?? ''}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
        >
          <option value="">{placeholder}</option>
          {filteredOptions.map((option) => (
            <option key={String(option[valueField])} value={String(option[valueField])}>
              {String(option[displayField])}
            </option>
          ))}
        </select>

        {/* Link al form di creazione - apre in nuova tab */}
        <Link
          href={createUrl}
          target="_blank"
          className="px-2 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-200 flex items-center justify-center"
          title={`Aggiungi ${entityName}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Link>
      </div>

      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  )
}
