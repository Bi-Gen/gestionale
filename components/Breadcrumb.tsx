'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Mappa dei segmenti URL ai loro label visibili
const segmentLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  ordini: 'Ordini',
  acquisto: 'Acquisto',
  vendita: 'Vendita',
  nuovo: 'Nuovo',
  modifica: 'Modifica',
  magazzino: 'Magazzino',
  movimenti: 'Movimenti',
  giacenze: 'Giacenze',
  prodotti: 'Prodotti',
  clienti: 'Clienti',
  fornitori: 'Fornitori',
  agenti: 'Agenti',
  fatture: 'Fatture',
  'prima-nota': 'Prima Nota',
  trasferimenti: 'Trasferimenti',
  analytics: 'Analytics',
  configurazioni: 'Configurazioni',
  'codici-pagamento': 'Codici Pagamento',
  'codici-iva': 'Codici IVA',
  magazzini: 'Magazzini',
  categorie: 'Categorie',
  geografia: 'Geografia',
  profilo: 'Profilo',
  impostazioni: 'Impostazioni',
}

// Funzione per ottenere il label di un segmento
function getSegmentLabel(segment: string, index: number, allSegments: string[]): string {
  // Se è un numero (ID), mostra come #ID
  if (/^\d+$/.test(segment)) {
    return `#${segment}`
  }

  // Altrimenti usa la mappa dei labels
  return segmentLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}

export default function Breadcrumb() {
  const pathname = usePathname()

  // Dividi il pathname in segmenti
  const segments = pathname.split('/').filter(Boolean)

  // Se siamo sulla home, non mostrare breadcrumb
  if (segments.length === 0 || pathname === '/') {
    return null
  }

  // Costruisci i breadcrumb
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const label = getSegmentLabel(segment, index, segments)
    const isLast = index === segments.length - 1

    return {
      label,
      path,
      isLast,
    }
  })

  return (
    <nav className="flex mb-6" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.path} className="inline-flex items-center">
            {/* Separatore */}
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 mx-1"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}

            {/* Link o testo */}
            {crumb.isLast ? (
              <span className="text-sm font-medium text-gray-500">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.path}
                className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {index === 0 && (
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                )}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
