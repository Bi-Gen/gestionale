'use client'

import { useAuth } from '@/contexts/AuthContext'

export function usePermissions() {
  const { utenteAzienda, isSuperadmin } = useAuth()

  const hasPermission = (area: string, level: 'read' | 'write' | 'delete'): boolean => {
    // Superadmin ha tutti i permessi
    if (isSuperadmin) return true

    // Owner ha tutti i permessi
    if (utenteAzienda?.ruolo === 'owner') return true

    // Check permessi granulari
    if (!utenteAzienda?.permessi) return false

    const areaPermissions = utenteAzienda.permessi[area]
    if (!areaPermissions) return false

    return areaPermissions[level] === true
  }

  const canRead = (area: string) => hasPermission(area, 'read')
  const canWrite = (area: string) => hasPermission(area, 'write')
  const canDelete = (area: string) => hasPermission(area, 'delete')

  const canCreate = (area: string) => canWrite(area)
  const canEdit = (area: string) => canWrite(area)
  const canView = (area: string) => canRead(area)

  return {
    hasPermission,
    canRead,
    canWrite,
    canDelete,
    canCreate,
    canEdit,
    canView,
  }
}
