'use client'

import { useCallback, useEffect, useState } from 'react'
import { DayType, DIET_DATA, Option, ScheduleType } from '@/lib/data'
import { MacroBar } from '@/components/MacroBar'
import { MealCard } from '@/components/MealCard'
import { DaySelector } from '@/components/DaySelector'
import { Timeline } from '@/components/Timeline'
import { AVATAR_OPTIONS, AVATAR_SVGS, AVATAR_LABELS, ActivityType, computeNutritionPlan, GoalType, SexType } from '@/lib/profiles'
import { useProfiles } from '@/lib/useProfiles'
import { RefreshCw } from 'lucide-react'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function monthISO() {
  return new Date().toISOString().slice(0, 7)
}

function buildCalendarDays() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = []

  for (let i = 0; i < firstWeekday; i += 1) cells.push(null)
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day)

  return { cells }
}

interface Selection {
  meal_id: string
  option_id: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
}

const defaultPlanForm = {
  age: 30,
  sex: 'male' as SexType,
  heightCm: 175,
  weightKg: 75,
  trainingDays: 4,
  activity: 'medium' as ActivityType,
  goal: 'maintain' as GoalType,
}

export default function HomePage() {
  const { ready, profiles, activeProfile, createProfile, login, logout, updatePlan, updateProfile, deleteProfile } = useProfiles()
  const userId = activeProfile?.id ?? ''
  const [dayType, setDayType] = useState<DayType>('fuerza')
  const [schedule, setSchedule] = useState<ScheduleType>('tarde')
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [completedDates, setCompletedDates] = useState<string[]>([])
  const [cheatDates, setCheatDates] = useState<string[]>([])
  const [cheatNote, setCheatNote] = useState('')
  const [profileName, setProfileName] = useState('')
  const [profilePin, setProfilePin] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0])
  const [loginProfileId, setLoginProfileId] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState(defaultPlanForm)
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [editingPin, setEditingPin] = useState('')
  const [editingAvatar, setEditingAvatar] = useState<string>(AVATAR_OPTIONS[0])
  const [showCreateProfile, setShowCreateProfile] = useState(false)
  const [profileScreen, setProfileScreen] = useState<'select' | 'login' | 'create'>('select')
  const [screenVisible, setScreenVisible] = useState(false)

  const date = todayISO()
  const month = monthISO()

  useEffect(() => {
    setScreenVisible(false)
    const timer = setTimeout(() => setScreenVisible(true), 20)
    return () => clearTimeout(timer)
  }, [activeProfile?.id, loginProfileId, profileScreen])

  const scheduleKey = dayType === 'descanso' || dayType === 'cardio' ? 'main' : schedule
  const dayData = DIET_DATA[dayType][scheduleKey]
  const expectedMeals = dayData.meals.length
  const selectedMeals = Object.keys(selections).length
  const isTodayCompleted = selectedMeals === expectedMeals && expectedMeals > 0
  const { cells } = buildCalendarDays()
  const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const computedTarget = activeProfile?.plan
    ? {
        kcal: activeProfile.plan.targetKcal,
        prot: activeProfile.plan.protein,
        carbs: activeProfile.plan.carbs,
        grasa: activeProfile.plan.fat,
      }
    : dayData.macros

  const saveDayLog = useCallback(
    async (dt: DayType, sc: ScheduleType, completed = false, cheatNoteValue = '') => {
      if (!ready || !userId) return
      await fetch('/api/selections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, dayType: dt, schedule: sc, completed, cheatNote: cheatNoteValue }),
      })
    },
    [ready, userId, date]
  )

  useEffect(() => {
    if (!ready || !userId) return
    setLoading(true)
    fetch(`/api/selections/log?userId=${userId}&date=${date}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.log) {
          setDayType(data.log.day_type as DayType)
          setSchedule(data.log.schedule as ScheduleType)
          setCheatNote(data.log.cheat_note ?? '')
        }
        if (data.selections?.length) {
          const map: Record<string, Selection> = {}
          for (const s of data.selections) map[s.meal_id] = s
          setSelections(map)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [ready, userId, date])

  useEffect(() => {
    if (!ready || !userId) return
    fetch(`/api/selections/log?userId=${userId}&month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setCompletedDates(data.completedDates ?? [])
        setCheatDates(data.cheatDates ?? [])
      })
      .catch(() => {})
  }, [ready, userId, month])

  function updateCompletedDatesForToday(completed: boolean) {
    setCompletedDates((prev) => {
      const set = new Set(prev)
      if (completed) set.add(date)
      else set.delete(date)
      return Array.from(set)
    })
  }

  function updateCheatDatesForToday(hasCheatNote: boolean) {
    setCheatDates((prev) => {
      const set = new Set(prev)
      if (hasCheatNote) set.add(date)
      else set.delete(date)
      return Array.from(set)
    })
  }

  function handleDayType(dt: DayType) {
    setDayType(dt)
    setSelections({})
    saveDayLog(dt, schedule, false, cheatNote)
    updateCompletedDatesForToday(false)
  }

  function handleSchedule(sc: ScheduleType) {
    setSchedule(sc)
    setSelections({})
    saveDayLog(dayType, sc, false, cheatNote)
    updateCompletedDatesForToday(false)
  }

  async function handleSelect(mealId: string, option: Option) {
    if (!ready || !userId) return
    setSaving(true)
    setErrorMsg(null)
    const sel: Selection = {
      meal_id: mealId,
      option_id: option.id,
      kcal: option.kcal,
      prot: option.prot,
      carbs: option.carbs,
      grasa: option.grasa,
    }
    const previousSelection = selections[mealId]
    const nextSelections = { ...selections, [mealId]: sel }
    setSelections(nextSelections)

    try {
      const res = await fetch('/api/selections/meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, mealId, optionId: option.id, ...sel }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo guardar la selección')
      }
      const completed = Object.keys(nextSelections).length === expectedMeals
      await saveDayLog(dayType, schedule, completed, cheatNote)
      updateCompletedDatesForToday(completed)
    } catch (err) {
      setSelections((prev) => {
        const next = { ...prev }
        if (previousSelection) next[mealId] = previousSelection
        else delete next[mealId]
        return next
      })
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeselect(mealId: string) {
    if (!ready || !userId) return
    setSaving(true)
    setErrorMsg(null)
    const previousSelection = selections[mealId]
    const nextSelections = { ...selections }
    delete nextSelections[mealId]
    setSelections(nextSelections)

    try {
      const res = await fetch('/api/selections/meal', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, mealId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No se pudo quitar la selección')
      }
      await saveDayLog(dayType, schedule, false, cheatNote)
      updateCompletedDatesForToday(false)
    } catch (err) {
      if (previousSelection) setSelections((prev) => ({ ...prev, [mealId]: previousSelection }))
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveCheatNote(nextCheatNote?: string) {
    if (!ready || !userId) return
    setSaving(true)
    setErrorMsg(null)
    const value = nextCheatNote ?? cheatNote
    try {
      await saveDayLog(dayType, schedule, isTodayCompleted, value)
      updateCheatDatesForToday(Boolean(value.trim()))
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido al guardar')
    } finally {
      setSaving(false)
    }
  }

  function handleCreateProfile() {
    setAuthError(null)
    if (!profileName.trim()) return setAuthError('Pon un nombre al perfil')
    if (!/^\d{4}$/.test(profilePin)) return setAuthError('El PIN debe tener 4 numeros')
    createProfile({ name: profileName, pin: profilePin, avatar: selectedAvatar })
    setProfileName('')
    setProfilePin('')
    setLoginPin('')
    setShowCreateProfile(false)
  }

  function handleLogin() {
    setAuthError(null)
    if (!loginProfileId) return setAuthError('Selecciona un perfil')
    const result = login(loginProfileId, loginPin)
    if (!result.ok) return setAuthError(result.message)
    setLoginPin('')
  }

  function handleSavePlan() {
    if (!activeProfile) return
    const plan = computeNutritionPlan(planForm)
    updatePlan(activeProfile.id, plan)
  }

  function beginEditProfile(profileId: string) {
    const profile = profiles.find((p) => p.id === profileId)
    if (!profile) return
    setEditingProfileId(profile.id)
    setEditingName(profile.name)
    setEditingPin(profile.pin)
    setEditingAvatar(profile.avatar)
    setAuthError(null)
  }

  function handleSaveProfileEdit() {
    if (!editingProfileId) return
    if (!editingName.trim()) return setAuthError('El nombre no puede estar vacio')
    if (!/^\d{4}$/.test(editingPin)) return setAuthError('El PIN debe tener 4 numeros')
    updateProfile(editingProfileId, { name: editingName, pin: editingPin, avatar: editingAvatar })
    setEditingProfileId(null)
    setAuthError(null)
  }

  function handleDeleteProfile(profileId: string) {
    deleteProfile(profileId)
    if (loginProfileId === profileId) setLoginProfileId('')
    if (editingProfileId === profileId) setEditingProfileId(null)
  }

  const current = Object.values(selections).reduce(
    (acc, s) => ({
      kcal: acc.kcal + s.kcal,
      prot: acc.prot + s.prot,
      carbs: acc.carbs + s.carbs,
      grasa: acc.grasa + s.grasa,
    }),
    { kcal: 0, prot: 0, carbs: 0, grasa: 0 }
  )

  const dateFormatted = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Preparando perfiles...</span>
        </div>
      </div>
    )
  }


  // Profile screen state machine: 'select' | 'login' | 'create'

  if (!activeProfile) {
    const selectedProfile = profiles.find((p) => p.id === loginProfileId)

    // ── CREATE screen ──────────────────────────────────────────────
    if (profileScreen === 'create') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
          <div className="max-w-lg mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-4">
            <button
              onClick={() => { setProfileScreen('select'); setAuthError(null) }}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 self-start"
            >
              ← Volver
            </button>

            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo perfil</h1>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nombre</label>
                <input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">PIN (4 dígitos)</label>
                <input
                  value={profilePin}
                  onChange={(e) => setProfilePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="1234"
                  type="password"
                  inputMode="numeric"
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Elige tu avatar</label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATAR_OPTIONS.map((id) => (
                    <button
                      key={id}
                      onClick={() => setSelectedAvatar(id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        selectedAvatar === id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden"
                        dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[id] }}
                      />
                      <span className="text-xs text-gray-600 dark:text-gray-300">{AVATAR_LABELS[id]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {authError && (
                <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>
              )}

              <button
                onClick={handleCreateProfile}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Crear perfil y entrar
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ── LOGIN screen ───────────────────────────────────────────────
    if (profileScreen === 'login' && selectedProfile) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
          <div className="max-w-lg mx-auto w-full px-4 py-6 flex-1 flex flex-col gap-4">
            <button
              onClick={() => { setProfileScreen('select'); setLoginPin(''); setAuthError(null) }}
              className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 self-start"
            >
              ← Volver
            </button>

            <div className="flex flex-col items-center gap-3 mt-4">
              <div
                className="w-24 h-24 rounded-full overflow-hidden shadow-md"
                dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[selectedProfile.avatar] ?? '' }}
              />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Hola, {selectedProfile.name}
              </h1>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block text-center">Introduce tu PIN</label>
              <input
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="• • • •"
                type="password"
                inputMode="numeric"
                autoFocus
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white text-center text-lg tracking-widest"
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }}
              />

              {authError && (
                <p className="text-xs text-red-600 dark:text-red-400 text-center">{authError}</p>
              )}

              <button
                onClick={handleLogin}
                className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Acceder
              </button>
            </div>
          </div>
        </div>
      )
    }

    // ── SELECT screen (default) ────────────────────────────────────
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <div className="max-w-lg mx-auto w-full px-4 py-8 flex-1 flex flex-col gap-5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">¿Quién eres?</h1>

          <div className="grid grid-cols-2 gap-3">
            {profiles.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setLoginProfileId(p.id)
                  setLoginPin('')
                  setAuthError(null)
                  setProfileScreen('login')
                }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              >
                <div
                  className="w-16 h-16 rounded-full overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[p.avatar] ?? '' }}
                />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
              </button>
            ))}

            <button
              onClick={() => {
                setProfileName('')
                setProfilePin('')
                setSelectedAvatar(AVATAR_OPTIONS[0])
                setAuthError(null)
                setProfileScreen('create')
              }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-3xl text-gray-400 dark:text-gray-500">+</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Añadir perfil</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!activeProfile.plan) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className={`max-w-lg mx-auto px-4 py-8 space-y-4 transition-all duration-300 ease-out ${
          screenVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}>
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{activeProfile.avatar} {activeProfile.name}</h1>
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-700">Cambiar perfil</button>
          </div>
          <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-white">Configuracion inicial</h2>
            <p className="text-xs text-gray-200 leading-relaxed">
              Estos datos se usan para calcular tu gasto calorico, tu objetivo diario de kcal y tus macros.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-white">
                Edad (anos)
                <input type="number" value={planForm.age} onChange={(e) => setPlanForm((p) => ({ ...p, age: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-xs text-white">
                Estatura (cm)
                <input type="number" value={planForm.heightCm} onChange={(e) => setPlanForm((p) => ({ ...p, heightCm: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-xs text-white">
                Peso actual (kg)
                <input type="number" value={planForm.weightKg} onChange={(e) => setPlanForm((p) => ({ ...p, weightKg: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
              </label>
              <label className="text-xs text-white">
                Dias de entreno/semana
                <input type="number" value={planForm.trainingDays} onChange={(e) => setPlanForm((p) => ({ ...p, trainingDays: Number(e.target.value) || 0 }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <label className="text-xs text-white">
                Sexo
                <select value={planForm.sex} onChange={(e) => setPlanForm((p) => ({ ...p, sex: e.target.value as SexType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"><option value="male">Hombre</option><option value="female">Mujer</option></select>
              </label>
              <label className="text-xs text-white">
                Actividad diaria
                <select value={planForm.activity} onChange={(e) => setPlanForm((p) => ({ ...p, activity: e.target.value as ActivityType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"><option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option></select>
              </label>
              <label className="text-xs text-white">
                Objetivo
                <select value={planForm.goal} onChange={(e) => setPlanForm((p) => ({ ...p, goal: e.target.value as GoalType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white"><option value="loss">Perder grasa</option><option value="gain">Ganar musculo</option><option value="maintain">Mantener</option></select>
              </label>
            </div>
            <div className="rounded-xl bg-gray-800/70 border border-gray-700 px-3 py-2 text-[11px] text-gray-200 leading-relaxed">
              <p><span className="font-semibold text-white">Actividad baja:</span> 0-2 entrenos/semana o vida muy sedentaria.</p>
              <p><span className="font-semibold text-white">Actividad media:</span> 3-4 entrenos/semana y actividad normal.</p>
              <p><span className="font-semibold text-white">Actividad alta:</span> 5-7 entrenos/semana o trabajo fisico.</p>
            </div>
            <p className="text-xs text-gray-300">
              Se calculara automaticamente: kcal objetivo, proteina, carbohidratos y grasas.
            </p>
            <button onClick={handleSavePlan} className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Guardar objetivo y continuar</button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw size={16} className="animate-spin" />
          <span className="text-sm">Cargando...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className={`max-w-lg mx-auto px-4 py-6 space-y-4 transition-all duration-300 ease-out ${
        screenVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{activeProfile.avatar} {activeProfile.name}</h1>
            <p className="text-sm text-gray-400 capitalize">{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <div className="flex items-center gap-1.5 text-xs text-gray-400"><RefreshCw size={12} className="animate-spin" />Guardando</div>}
            <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-700">Cambiar perfil</button>
          </div>
        </div>

        <DaySelector dayType={dayType} schedule={schedule} onDayType={handleDayType} onSchedule={handleSchedule} />
        <MacroBar current={current} target={computedTarget} />
        <div className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-3 py-2">
          Objetivo: {activeProfile.plan.goal === 'loss' ? 'perdida progresiva' : activeProfile.plan.goal === 'gain' ? 'ganancia muscular' : 'mantenimiento'} · TDEE {activeProfile.plan.tdee} kcal · Meta {activeProfile.plan.targetKcal} kcal
        </div>

        {errorMsg && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 leading-relaxed">{errorMsg}</div>}
        {dayData.dayNote && <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 leading-relaxed">{dayData.dayNote}</div>}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"><Timeline items={dayData.timeline} /></div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Calendario de cumplimiento</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isTodayCompleted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>Hoy: {isTodayCompleted ? 'completado' : `${selectedMeals}/${expectedMeals}`}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">{weekdayLabels.map((label) => <div key={label} className="text-[10px] text-center text-gray-400 font-medium">{label}</div>)}</div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} className="h-8" />
              const dayISO = `${month}-${String(day).padStart(2, '0')}`
              const completed = completedDates.includes(dayISO)
              const cheated = cheatDates.includes(dayISO)
              const isToday = dayISO === date
              return <div key={dayISO} className={`h-8 rounded-lg text-xs flex items-center justify-center border ${cheated ? 'bg-amber-500 text-white border-amber-500' : completed ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'} ${isToday ? 'ring-1 ring-blue-300 dark:ring-blue-700' : ''}`}>{day}</div>
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">Verde: dieta cumplida. Naranja: día con excepción.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Día con excepción</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Si hoy te saliste de la dieta, apunta con qué fue (ej: pizza, helado, cena fuera).</p>
          <input value={cheatNote} onChange={(e) => setCheatNote(e.target.value)} placeholder="Ejemplo: hamburguesa y patatas" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700" />
          <div className="flex gap-2">
            <button onClick={() => handleSaveCheatNote()} className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors">Guardar excepción</button>
            <button onClick={() => { setCheatNote(''); handleSaveCheatNote('') }} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">Quitar marca</button>
          </div>
        </div>

        <div className="space-y-3">
          {dayData.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} selectedOptionId={selections[meal.id]?.option_id ?? null} onSelect={(opt) => handleSelect(meal.id, opt)} onDeselect={() => handleDeselect(meal.id)} />
          ))}
        </div>
        <div className="h-8" />
      </div>
    </div>
  )
}
