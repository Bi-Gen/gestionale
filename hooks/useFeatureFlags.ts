'use client'

import { useAuth } from '@/contexts/AuthContext'

export function useFeatureFlags() {
  const { azienda, isSuperadmin } = useAuth()

  const hasFeature = (feature: string): boolean => {
    // Superadmin ha accesso a tutte le feature
    if (isSuperadmin) return true

    // Check feature flags dell'azienda
    if (!azienda?.features_abilitate) return false

    return azienda.features_abilitate[feature] === true
  }

  const getPianoName = (): string => {
    if (isSuperadmin) return 'SuperAdmin'
    return azienda?.piano || 'unknown'
  }

  const isTrialActive = (): boolean => {
    if (!azienda) return false
    if (azienda.stato !== 'trial') return false

    const trialDate = azienda.trial_fino_a
    if (!trialDate) return false

    return new Date(trialDate) > new Date()
  }

  const getTrialDaysRemaining = (): number => {
    if (!isTrialActive()) return 0

    const trialDate = new Date(azienda!.trial_fino_a!)
    const today = new Date()
    const diffTime = trialDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return Math.max(0, diffDays)
  }

  return {
    hasFeature,
    getPianoName,
    isTrialActive,
    getTrialDaysRemaining,
  }
}
