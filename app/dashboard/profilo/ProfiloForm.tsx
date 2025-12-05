'use client'

import { useState, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { updateProfile } from '@/app/actions/auth'

interface UserData {
  id: string
  email: string
  fullName: string
  avatarUrl: string | null
  phone: string
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Salvataggio...' : 'Salva Modifiche'}
    </button>
  )
}

export default function ProfiloForm({ user }: { user: UserData }) {
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validazione
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Seleziona un file immagine valido' })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'L\'immagine deve essere inferiore a 2MB' })
      return
    }

    setUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        setMessage({ type: 'error', text: result.error || 'Errore durante il caricamento' })
      } else if (result.avatarUrl) {
        setAvatarUrl(result.avatarUrl)
        setMessage({ type: 'success', text: 'Avatar aggiornato con successo' })
      }
    } catch (error) {
      console.error('Avatar upload error:', error)
      setMessage({ type: 'error', text: 'Errore durante il caricamento' })
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setMessage(null)
    const result = await updateProfile(formData)

    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Profilo aggiornato con successo' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Messaggio */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700'
              : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Avatar Section */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Foto Profilo</h2>

        <div className="flex items-center gap-6">
          {/* Avatar Preview */}
          <div
            onClick={handleAvatarClick}
            className="relative cursor-pointer group"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 group-hover:border-blue-400 transition-colors"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-3xl font-medium border-4 border-gray-200 group-hover:border-blue-400 transition-colors">
                {user.fullName?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            {/* Loading Spinner */}
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">
              Clicca sull'immagine per caricare una nuova foto
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG o GIF. Max 2MB.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Profile Info Form */}
      <form action={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Informazioni Personali</h2>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
            />
            <p className="mt-1 text-xs text-gray-400">
              L'email non può essere modificata
            </p>
          </div>

          {/* Nome Completo */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Completo
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              defaultValue={user.fullName}
              placeholder="Mario Rossi"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Telefono */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              defaultValue={user.phone}
              placeholder="+39 123 456 7890"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
