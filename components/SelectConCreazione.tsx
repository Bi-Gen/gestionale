'use client'

import { useState } from 'react'

// Tipo per la configurazione dei campi del form minimale
export type QuickCreateField = {
  name: string
  label: string
  type: 'text' | 'number' | 'hidden'
  required?: boolean
  placeholder?: string
  defaultValue?: string | number
}

// Props del componente
export type SelectConCreazioneProps<T> = {
  // Configurazione base
  name: string                    // nome del campo per il form
  label: string                   // etichetta visualizzata
  entityName: string              // es: "Macrofamiglia", "Categoria Cliente"
  entityType: string              // es: "macrofamiglia", "categoria_cliente" - per API

  // Dati
  options: T[]                    // lista opzioni esistenti
  valueField: keyof T             // campo da usare come value (es: "id")
  displayField: keyof T           // campo da visualizzare (es: "nome")

  // Stato
  value?: string | number         // valore selezionato
  onChange?: (value: string | number | undefined) => void
  defaultValue?: string | number

  // Quick Create
  quickCreateFields: QuickCreateField[]  // campi per il form di creazione rapida

  // Opzioni UI
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
  className?: string

  // Callback dopo creazione - per aggiornare la lista nel parent
  onCreated?: (newItem: Record<string, unknown>) => void
}

export default function SelectConCreazione<T extends Record<string, unknown>>({
  name,
  label,
  entityName,
  entityType,
  options,
  valueField,
  displayField,
  value,
  onChange,
  defaultValue,
  quickCreateFields,
  required = false,
  disabled = false,
  placeholder = 'Seleziona...',
  helpText,
  className = '',
  onCreated,
}: SelectConCreazioneProps<T>) {
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value ?? defaultValue)

  // Gestione cambio selezione
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value ? (typeof defaultValue === 'number' ? parseInt(e.target.value) : e.target.value) : undefined
    setSelectedValue(newValue)
    onChange?.(newValue)
  }

  // Gestione submit form quick create
  const handleQuickCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const fields: Record<string, unknown> = { entityType }

    // Estrai i campi dal form
    quickCreateFields.forEach(field => {
      const value = formData.get(field.name)
      if (value !== null && value !== '') {
        fields[field.name] = field.type === 'number' ? Number(value) : value
      }
    })

    try {
      console.log('Invio richiesta quick-create:', fields)

      const response = await fetch('/api/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields)
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response body:', result)

      if (result.success && result.data) {
        // Seleziona il nuovo elemento
        const newValue = result.data[valueField as string]
        setSelectedValue(newValue)
        onChange?.(newValue)

        // Callback per aggiornare la lista nel parent
        onCreated?.(result.data)

        // Chiudi modale
        setShowModal(false)
      } else {
        setError(result.error || 'Errore durante la creazione')
      }
    } catch (err) {
      setError('Errore di connessione')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
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

        {/* Pulsante Quick Create - discreto */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
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

      {/* Modale Quick Create */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Nuovo/a {entityName}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleQuickCreate}>
              <div className="px-6 py-4 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {quickCreateFields.filter(f => f.type !== 'hidden').map((field) => (
                  <div key={field.name}>
                    <label htmlFor={`quick_${field.name}`} className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type={field.type}
                      id={`quick_${field.name}`}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
                  </div>
                ))}

                {/* Campi hidden */}
                {quickCreateFields.filter(f => f.type === 'hidden').map((field) => (
                  <input
                    key={field.name}
                    type="hidden"
                    name={field.name}
                    defaultValue={field.defaultValue}
                  />
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400"
                >
                  {isLoading ? 'Creazione...' : 'Crea'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isLoading}
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium transition-colors"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
