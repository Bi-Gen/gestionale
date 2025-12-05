import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // TODO: Sostituisci questo URL con l'URL embed del tuo report Power BI
  const powerBIEmbedUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || ''

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 bg-white border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Analytics
        </h2>
        <p className="text-gray-600">
          Dashboard Power BI con analisi avanzate del gestionale
        </p>
      </div>

      <div className="flex-1 p-6">
        {powerBIEmbedUrl ? (
          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <iframe
              title="Power BI Report"
              src={powerBIEmbedUrl}
              className="w-full h-full"
              frameBorder="0"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center p-8">
              <div className="text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Dashboard Power BI non configurata
              </h3>
              <p className="text-gray-600 mb-4">
                Aggiungi l'URL embed del tuo report Power BI nelle variabili d'ambiente
              </p>
              <code className="text-sm bg-gray-100 px-3 py-1 rounded">
                NEXT_PUBLIC_POWERBI_EMBED_URL
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
