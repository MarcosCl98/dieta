'use client'

import { useEffect, useMemo, useState } from 'react'
import { UserPlan, UserProfile } from '@/lib/profiles'

const PROFILES_KEY = 'dieta_profiles_v1'
const ACTIVE_PROFILE_KEY = 'dieta_active_profile_v1'

function uid() {
  return crypto.randomUUID()
}

export function useProfiles() {
  const [ready, setReady] = useState(false)
  const [profiles, setProfiles] = useState<UserProfile[]>([])
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null)

  useEffect(() => {
    try {
      const rawProfiles = localStorage.getItem(PROFILES_KEY)
      const rawActive = localStorage.getItem(ACTIVE_PROFILE_KEY)
      if (rawProfiles) setProfiles(JSON.parse(rawProfiles))
      if (rawActive) setActiveProfileId(rawActive)
    } catch {
      setProfiles([])
      setActiveProfileId(null)
    } finally {
      setReady(true)
    }
  }, [])

  function persist(nextProfiles: UserProfile[], nextActiveId: string | null) {
    setProfiles(nextProfiles)
    setActiveProfileId(nextActiveId)
    localStorage.setItem(PROFILES_KEY, JSON.stringify(nextProfiles))
    if (nextActiveId) localStorage.setItem(ACTIVE_PROFILE_KEY, nextActiveId)
    else localStorage.removeItem(ACTIVE_PROFILE_KEY)
  }

  function createProfile(payload: { name: string; avatar: string; pin: string }) {
    const next: UserProfile = {
      id: uid(),
      name: payload.name.trim(),
      avatar: payload.avatar,
      pin: payload.pin,
      plan: null,
    }
    const nextProfiles = [...profiles, next]
    persist(nextProfiles, next.id)
    return next
  }

  function login(profileId: string, pin: string) {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return { ok: false as const, message: 'Perfil no encontrado' }
    if (profile.pin !== pin) return { ok: false as const, message: 'PIN incorrecto' }
    persist(profiles, profile.id)
    return { ok: true as const }
  }

  function logout() {
    persist(profiles, null)
  }

  function updatePlan(profileId: string, plan: UserPlan) {
    const nextProfiles = profiles.map((p) => (p.id === profileId ? { ...p, plan } : p))
    persist(nextProfiles, activeProfileId)
  }

  function updateProfile(profileId: string, payload: { name?: string; avatar?: string; pin?: string }) {
    const nextProfiles = profiles.map((p) => {
      if (p.id !== profileId) return p
      return {
        ...p,
        name: payload.name !== undefined ? payload.name.trim() : p.name,
        avatar: payload.avatar ?? p.avatar,
        pin: payload.pin ?? p.pin,
      }
    })
    persist(nextProfiles, activeProfileId)
  }

  function deleteProfile(profileId: string) {
    const nextProfiles = profiles.filter((p) => p.id !== profileId)
    const nextActiveId = activeProfileId === profileId ? null : activeProfileId
    persist(nextProfiles, nextActiveId)
  }

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  )

  return {
    ready,
    profiles,
    activeProfile,
    createProfile,
    login,
    logout,
    updatePlan,
    updateProfile,
    deleteProfile,
  }
}

