'use client'

import { useState, useEffect } from 'react'

// Props del componente
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

  // URL per creare nuovo elemento
  createUrl: string               // es: "/dashboard/configurazioni/macrofamiglie/nuovo"

  // Canale per ricevere notifiche di creazione
  channelName: string             // es: "macrofamiglia-created"

  // Opzioni UI
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
  className?: string

  // Callback dopo creazione - per aggiornare la lista nel parent
  onCreated?: (newItem: T) => void
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
  channelName,
  required = false,
  disabled = false,
  placeholder = 'Seleziona...',
  helpText,
  className = '',
  onCreated,
}: SelectConCreazioneProps<T>) {
  const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value ?? defaultValue)

  // Ascolta messaggi dal BroadcastChannel per nuovi elementi creati
  useEffect(() => {
    if (typeof window === 'undefined') return

    const channel = new BroadcastChannel(channelName)

    channel.onmessage = (event) => {
      if (event.data?.type === 'created' && event.data?.item) {
        const newItem = event.data.item as T

        // Seleziona automaticamente il nuovo elemento
        const newValue = newItem[valueField]
        if (newValue !== undefined) {
          setSelectedValue(newValue as string | number)
          onChange?.(newValue as string | number)
        }

        // Callback per aggiornare la lista nel parent
        onCreated?.(newItem)
      }
    }

    return () => {
      channel.close()
    }
  }, [channelName, valueField, onChange, onCreated])

  // Gestione cambio selezione
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value ? (typeof defaultValue === 'number' ? parseInt(e.target.value) : e.target.value) : undefined
    setSelectedValue(newValue)
    onChange?.(newValue)
  }

  // Apri finestra per creare nuovo elemento
  const handleOpenCreate = () => {
    // Apri in una nuova finestra popup
    const width = 800
    const height = 700
    const left = (window.screen.width - width) / 2
    const top = (window.screen.height - height) / 2

    window.open(
      `${createUrl}?popup=true&channel=${channelName}`,
      `create_${channelName}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    )
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
          {options.map((option) => (
            <option key={String(option[valueField])} value={String(option[valueField])}>
              {String(option[displayField])}
            </option>
          ))}
        </select>

        {/* Pulsante per aprire form completo */}
        <button
          type="button"
          onClick={handleOpenCreate}
          disabled={disabled}
          className="px-2 py-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors disabled:text-gray-300 disabled:hover:bg-transparent flex items-center justify-center border border-transparent hover:border-blue-200"
          title={`Aggiungi ${entityName}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {helpText && (
        <p className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  )
}
