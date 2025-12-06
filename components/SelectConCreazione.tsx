'use client'

import { useState, useTransition, ReactNode } from 'react'

// Tipo per la configurazione dei campi del form minimale
export type QuickCreateField = {
  name: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea' | 'checkbox'
  required?: boolean
  placeholder?: string
  options?: { value: string | number; label: string }[] // per select
  defaultValue?: string | number | boolean
}

// Props del componente - T è il tipo delle opzioni, R è il tipo del risultato quick create
export type SelectConCreazioneProps<T, R = T> = {
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

  // Quick Create
  quickCreateFields: QuickCreateField[]  // campi per il form di creazione rapida
  onQuickCreate: (formData: FormData) => Promise<{ success: boolean; data?: R; error?: string }>

  // Opzioni UI
  required?: boolean
  disabled?: boolean
  placeholder?: string
  helpText?: string
  className?: string

  // Dipendenze (per filtri a cascata)
  parentValue?: string | number   // valore del parent (es: macrofamiglia_id per famiglia)
  filterFn?: (option: T, parentValue: string | number) => boolean  // funzione filtro

  // Callback dopo creazione - riceve il risultato parziale, il chiamante lo converte
  onCreated?: (newItem: R) => void
}

export default function SelectConCreazione<T extends Record<string, unknown>, R extends Record<string, unknown> = T>({
  name,
  label,
  entityName,
  options,
  valueField,
  displayField,
  value,
  onChange,
  defaultValue,
  quickCreateFields,
  onQuickCreate,
  required = false,
  disabled = false,
  placeholder = 'Seleziona...',
  helpText,
  className = '',
  parentValue,
  filterFn,
  onCreated,
}: SelectConCreazioneProps<T, R>) {
  const [showModal, setShowModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [localOptions, setLocalOptions] = useState<T[]>(options)
  const [selectedValue, setSelectedValue] = useState<string | number | undefined>(value ?? defaultValue)

  // Filtra opzioni se c'è un parent
  const filteredOptions = filterFn && parentValue
    ? localOptions.filter(opt => filterFn(opt, parentValue))
    : localOptions

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

    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      try {
        const result = await onQuickCreate(formData)

        if (result.success && result.data) {
          // Seleziona il nuovo elemento usando il valueField
          const newValue = (result.data as Record<string, unknown>)[valueField as string] as string | number
          setSelectedValue(newValue)
          onChange?.(newValue)

          // Callback - il chiamante gestirà l'aggiornamento della lista
          onCreated?.(result.data)

          // Chiudi modale
          setShowModal(false)
        } else {
          setError(result.error || 'Errore durante la creazione')
        }
      } catch (err) {
        setError('Errore imprevisto')
        console.error(err)
      }
    })
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

                {quickCreateFields.map((field) => (
                  <div key={field.name}>
                    <label htmlFor={`quick_${field.name}`} className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input
                        type="text"
                        id={`quick_${field.name}`}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue as string}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'number' && (
                      <input
                        type="number"
                        id={`quick_${field.name}`}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue as number}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea
                        id={`quick_${field.name}`}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        defaultValue={field.defaultValue as string}
                        rows={3}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    )}

                    {field.type === 'select' && field.options && (
                      <select
                        id={`quick_${field.name}`}
                        name={field.name}
                        required={field.required}
                        defaultValue={field.defaultValue as string}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      >
                        <option value="">Seleziona...</option>
                        {field.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {field.type === 'checkbox' && (
                      <div className="mt-1 flex items-center">
                        <input
                          type="checkbox"
                          id={`quick_${field.name}`}
                          name={field.name}
                          defaultChecked={field.defaultValue as boolean}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">{field.placeholder}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400"
                >
                  {isPending ? 'Creazione...' : `Crea ${entityName}`}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
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
