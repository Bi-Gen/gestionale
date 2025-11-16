import Link from 'next/link'

interface WorkInProgressProps {
  title: string
  description?: string
  icon?: string
}

export default function WorkInProgress({
  title,
  description = "Questa sezione è attualmente in fase di sviluppo.",
  icon = "🚧"
}: WorkInProgressProps) {
  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto mt-20">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-6">{icon}</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-gray-600 mb-2">
            {description}
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Torneremo presto con questa funzionalità!
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Torna alla Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
