'use client'

import { useCallback, useEffect, useState } from 'react'
import { DayType, DIET_DATA, Option, ScheduleType } from '@/lib/data'
import { MacroBar } from '@/components/MacroBar'
import { MealCard } from '@/components/MealCard'
import { DaySelector } from '@/components/DaySelector'
import { Timeline } from '@/components/Timeline'
import { AVATAR_OPTIONS, AVATAR_SVGS, ActivityType, computeNutritionPlan, GoalType, SexType } from '@/lib/profiles'
import { scaleDayData } from '@/lib/scale'
import { FoodSearchModal } from '@/components/FoodSearchModal'
import { useProfiles } from '@/lib/useProfiles'
import { RefreshCw, ChevronLeft, Scale } from 'lucide-react'

function todayISO() { return new Date().toISOString().slice(0, 10) }
function monthISO() { return new Date().toISOString().slice(0, 7) }
function lastMondayISO() {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}
function isMonday() { return new Date().getDay() === 1 }

function buildCalendarDays() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstWeekday = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: Array<number | null> = []
  for (let i = 0; i < firstWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return cells
}

interface Selection {
  meal_id: string; option_id: string; kcal: number; prot: number; carbs: number; grasa: number
}
interface WeightEntry { date: string; weight_kg: number }

const defaultPlanForm = {
  age: 0, sex: 'male' as SexType, heightCm: 0, weightKg: 0,
  trainingDays: 4, activity: 'medium' as ActivityType, goal: 'gain' as GoalType,
}

// Simple SVG line chart
function WeightChart({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return (
    <p className="text-xs text-gray-400 text-center py-4">Necesitas al menos 2 registros para ver la gráfica.</p>
  )
  const W = 320, H = 140, PAD = 28
  const weights = entries.map(e => e.weight_kg)
  const minW = Math.min(...weights) - 1
  const maxW = Math.max(...weights) + 1
  const cx = (i: number) => PAD + (i / (entries.length - 1)) * (W - PAD * 2)
  const cy = (w: number) => PAD + ((maxW - w) / (maxW - minW)) * (H - PAD * 2)
  const points = entries.map((e, i) => `${cx(i)},${cy(e.weight_kg)}`).join(' ')
  const areaPoints = `${cx(0)},${H - PAD} ${points} ${cx(entries.length - 1)},${H - PAD}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 140 }}>
      <polygon points={areaPoints} fill="rgba(59,130,246,0.12)" />
      <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" />
      {entries.map((e, i) => (
        <g key={e.date}>
          <circle cx={cx(i)} cy={cy(e.weight_kg)} r="4" fill="#3b82f6" />
          <text x={cx(i)} y={cy(e.weight_kg) - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{e.weight_kg}</text>
          {(i === 0 || i === entries.length - 1 || entries.length <= 6) && (
            <text x={cx(i)} y={H - 6} textAnchor="middle" fontSize="8" fill="#9ca3af">
              {e.date.slice(5).replace('-', '/')}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}

export default function HomePage() {
  const { ready, profiles, activeProfile, createProfile, login, logout, updatePlan, updateProfile, deleteProfile } = useProfiles()
  const userId = activeProfile?.id ?? ''

  // Day tracking state
  const [dayType, setDayType] = useState<DayType>('fuerza')
  const [schedule, setSchedule] = useState<ScheduleType>('tarde')
  const [showDayPrompt, setShowDayPrompt] = useState(false)
  const [dayPromptStep, setDayPromptStep] = useState<'type' | 'schedule'>('type')
  const [dayPromptType, setDayPromptType] = useState<DayType>('fuerza')
  const [pendingDayPrompt, setPendingDayPrompt] = useState(false)
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [completedDates, setCompletedDates] = useState<string[]>([])
  const [cheatDates, setCheatDates] = useState<string[]>([])
  const [loggedDates, setLoggedDates] = useState<string[]>([])
  const [cheatNote, setCheatNote] = useState('')

  // Profile screens: 'select' | 'login' | 'create' | 'delete'
  const [profileScreen, setProfileScreen] = useState<'select' | 'login' | 'create' | 'delete'>('select')
  const [profileName, setProfileName] = useState('')
  const [profilePin, setProfilePin] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_OPTIONS[0])
  const [loginProfileId, setLoginProfileId] = useState('')
  const [loginPin, setLoginPin] = useState('')
  const [deleteTargetId, setDeleteTargetId] = useState('')
  const [deletePin, setDeletePin] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)

  // App screens: 'main' | 'profile' (user profile/stats page)
  const [appScreen, setAppScreen] = useState<'main' | 'profile'>('main')

  // Plan form
  const [planForm, setPlanForm] = useState(defaultPlanForm)
  const [editingPlan, setEditingPlan] = useState(false)

  // Weight tracking
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [weeklyWeightInput, setWeeklyWeightInput] = useState('')
  const [showWeightPrompt, setShowWeightPrompt] = useState(false)
  const [weightSaving, setWeightSaving] = useState(false)

  // History viewer
  const [historyDate, setHistoryDate] = useState<string | null>(null)
  const [historyData, setHistoryData] = useState<{ log: { day_type: string; schedule: string; cheat_note: string | null; completed: boolean } | null; selections: { meal_id: string; option_id: string; kcal: number; prot: number; carbs: number; grasa: number }[] } | null>(null)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Cheat meal food search
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [cheatMealData, setCheatMealData] = useState<{ kcal: number; prot: number; carbs: number; grasa: number; items: string } | null>(null)
  // Which meal triggered food search: 'exception' | meal_id
  const [foodSearchTarget, setFoodSearchTarget] = useState<string>('exception')

  const date = todayISO()
  const month = monthISO()
  const monday = lastMondayISO()
  const scheduleKey = (dayType === 'descanso' || dayType === 'cardio') ? 'main' : schedule
  const rawDayData = DIET_DATA[dayType][scheduleKey]
  const dayData = activeProfile?.plan
    ? scaleDayData(rawDayData, activeProfile.plan.targetKcal)
    : rawDayData
  const expectedMeals = dayData.meals.length
  const selectedMeals = Object.keys(selections).length
  const isTodayCompleted = selectedMeals === expectedMeals && expectedMeals > 0
  const calendarCells = buildCalendarDays()
  const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  const computedTarget = activeProfile?.plan
    ? { kcal: activeProfile.plan.targetKcal, prot: activeProfile.plan.protein, carbs: activeProfile.plan.carbs, grasa: activeProfile.plan.fat }
    : dayData.macros

  // Load day data
  const saveDayLog = useCallback(async (dt: DayType, sc: ScheduleType, completed = false, cheatNoteValue = '') => {
    if (!ready || !userId) return
    await fetch('/api/selections/log', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, dayType: dt, schedule: sc, completed, cheatNote: cheatNoteValue }),
    })
  }, [ready, userId, date])

  useEffect(() => {
    if (!ready || !userId) return
    setLoading(true)
    fetch(`/api/selections/log?userId=${userId}&date=${date}`)
      .then(r => r.json())
      .then(data => {
        if (data.log) {
          setDayType(data.log.day_type as DayType)
          setSchedule(data.log.schedule as ScheduleType)
          setCheatNote(data.log.cheat_note ?? '')
          if (data.log.completed) {
            setCompletedDates(prev => Array.from(new Set([...prev, date])))
          }
          if (data.log.cheat_note) {
            setCheatDates(prev => Array.from(new Set([...prev, date])))
          }
        } else {
          // No log for today — show day type prompt (only after 02:00)
          // But if weight prompt will also show, defer day prompt until after
          const hour = new Date().getHours()
          if (hour >= 2) {
            setPendingDayPrompt(true)
          }
        }
        if (data.selections?.length) {
          const map: Record<string, Selection> = {}
          for (const s of data.selections) map[s.meal_id] = s
          setSelections(map)
        }
      })
      .catch(() => {}).finally(() => setLoading(false))
  }, [ready, userId, date])

  useEffect(() => {
    if (!ready || !userId) return
    fetch(`/api/selections/log?userId=${userId}&month=${month}`)
      .then(r => r.json())
      .then(data => {
        setCompletedDates(data.completedDates ?? [])
        setCheatDates(data.cheatDates ?? [])
        setLoggedDates(data.loggedDates ?? [])
      })
      .catch(() => {})
  }, [ready, userId, month])

  // Load weight entries
  useEffect(() => {
    if (!ready || !userId) return
    fetch(`/api/weight?userId=${userId}`)
      .then(r => r.json())
      .then(data => {
        const entries: WeightEntry[] = data.entries ?? []
        setWeightEntries(entries)
        // Show weight prompt if no entry in the last 7 days
        const today = new Date()
        const sevenDaysAgo = new Date(today)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoISO = sevenDaysAgo.toISOString().slice(0, 10)
        const hasRecentEntry = entries.some(e => e.date >= sevenDaysAgoISO)
        // If no recent entry needed AND day prompt pending, show day prompt directly
        if (!hasRecentEntry) {
          setShowWeightPrompt(true)
          // day prompt will fire after weight handled
        } else {
          // No weight prompt — if day prompt pending, show it now
          if (pendingDayPrompt) {
            setPendingDayPrompt(false)
            setShowDayPrompt(true)
            setDayPromptStep('type')
          }
        }

        // Backfill: if no entries at all but profile has an initial weight, insert it
        if (entries.length === 0 && activeProfile?.plan?.weightKg) {
          const initialWeight = activeProfile.plan.weightKg
          // Use the profile creation monday as the starting point
          fetch('/api/weight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date: monday, weightKg: initialWeight }),
          }).then(() => {
            setWeightEntries([{ date: monday, weight_kg: initialWeight }])
            setShowWeightPrompt(false) // already have a baseline
          }).catch(() => {})
        }
      })
      .catch(() => {})
  }, [ready, userId, monday])

  // Pre-fill plan form from active profile
  useEffect(() => {
    if (activeProfile?.plan) {
      setPlanForm({
        age: activeProfile.plan.age,
        sex: activeProfile.plan.sex,
        heightCm: activeProfile.plan.heightCm,
        weightKg: activeProfile.plan.weightKg,
        trainingDays: activeProfile.plan.trainingDays,
        activity: activeProfile.plan.activity,
        goal: activeProfile.plan.goal,
      })
    }
  }, [activeProfile?.id])

  function updateCompletedDatesForToday(completed: boolean) {
    setCompletedDates(prev => { const s = new Set(prev); completed ? s.add(date) : s.delete(date); return Array.from(s) })
  }
  function updateCheatDatesForToday(hasNote: boolean) {
    setCheatDates(prev => { const s = new Set(prev); hasNote ? s.add(date) : s.delete(date); return Array.from(s) })
  }

  function handleDayType(dt: DayType) {
    setDayType(dt)
    setSelections({})
    updateCompletedDatesForToday(false)
    saveDayLog(dt, schedule, false, cheatNote)
    if (ready && userId) {
      fetch('/api/selections/meal/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date }),
      }).catch(() => {})
    }
  }

  function handleSchedule(sc: ScheduleType) {
    setSchedule(sc)
    setSelections({})
    updateCompletedDatesForToday(false)
    saveDayLog(dayType, sc, false, cheatNote)
    if (ready && userId) {
      fetch('/api/selections/meal/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date }),
      }).catch(() => {})
    }
  }

  function handleConfirmDayPrompt(dt: DayType, sc: ScheduleType) {
    setDayType(dt)
    setSchedule(sc)
    setShowDayPrompt(false)
    saveDayLog(dt, sc, false, cheatNote)
  }

  function handleChangeDayType() {
    setDayPromptStep('type')
    setDayPromptType(dayType)
    setShowDayPrompt(true)
  }

  async function handleSelect(mealId: string, option: Option) {
    if (!ready || !userId) return
    setSaving(true); setErrorMsg(null)
    const sel: Selection = { meal_id: mealId, option_id: option.id, kcal: option.kcal, prot: option.prot, carbs: option.carbs, grasa: option.grasa }
    const prev = selections[mealId]
    const next = { ...selections, [mealId]: sel }
    setSelections(next)
    try {
      const res = await fetch('/api/selections/meal', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, date, mealId, optionId: option.id, ...sel }) })
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error ?? 'Error al guardar') }
      const completed = Object.keys(next).length === expectedMeals
      await saveDayLog(dayType, schedule, completed, cheatNote)
      updateCompletedDatesForToday(completed)
    } catch (err) {
      setSelections(p => { const n = { ...p }; if (prev) n[mealId] = prev; else delete n[mealId]; return n })
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  async function handleDeselect(mealId: string) {
    if (!ready || !userId) return
    setSaving(true); setErrorMsg(null)
    const prev = selections[mealId]
    const next = { ...selections }; delete next[mealId]
    setSelections(next)
    try {
      const res = await fetch('/api/selections/meal', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, date, mealId }) })
      if (!res.ok) { const d = await res.json().catch(() => null); throw new Error(d?.error ?? 'Error al quitar') }
      await saveDayLog(dayType, schedule, false, cheatNote)
      updateCompletedDatesForToday(false)
    } catch (err) {
      if (prev) setSelections(p => ({ ...p, [mealId]: prev }))
      setErrorMsg(err instanceof Error ? err.message : 'Error desconocido')
    } finally { setSaving(false) }
  }

  async function handleSaveCheatNote(note?: string) {
    if (!ready || !userId) return
    setSaving(true); setErrorMsg(null)
    const v = note ?? cheatNote
    try { await saveDayLog(dayType, schedule, isTodayCompleted, v); updateCheatDatesForToday(Boolean(v.trim())) }
    catch (err) { setErrorMsg(err instanceof Error ? err.message : 'Error') }
    finally { setSaving(false) }
  }

  // Profile handlers
  function handleCreateProfile() {
    setAuthError(null)
    if (!profileName.trim()) return setAuthError('Pon un nombre al perfil')
    if (!/^\d{4}$/.test(profilePin)) return setAuthError('El PIN debe tener 4 números')
    createProfile({ name: profileName, pin: profilePin, avatar: selectedAvatar })
    setProfileName(''); setProfilePin(''); setLoginPin('')
    setAppScreen('main')
  }

  function handleLogout() {
    // Reset all per-user state before switching profile
    setSelections({})
    setDayType('fuerza')
    setSchedule('tarde')
    setCheatNote('')
    setCompletedDates([])
    setCheatDates([])
    setWeightEntries([])
    setHistoryDate(null)
    setHistoryData(null)
    setAppScreen('main')
    setShowWeightPrompt(false)
    setCheatMealData(null)
    setShowFoodSearch(false)
    logout()
  }

  function handleLogin() {
    setAuthError(null)
    if (!loginProfileId) return setAuthError('Selecciona un perfil')
    const result = login(loginProfileId, loginPin)
    if (!result.ok) return setAuthError(result.message)
    setLoginPin('')
    setAppScreen('main')
  }

  function handleDeleteProfile() {
    setAuthError(null)
    if (!deleteTargetId) return setAuthError('Selecciona un perfil')
    const target = profiles.find(p => p.id === deleteTargetId)
    if (!target) return setAuthError('Perfil no encontrado')
    const isOwn = deletePin === target.pin
    const isMaster = deletePin === '0000'
    if (!isOwn && !isMaster) return setAuthError('PIN incorrecto')
    deleteProfile(deleteTargetId)
    setDeletePin(''); setDeleteTargetId(''); setProfileScreen('select')
  }

  // Plan handlers
  async function handleSavePlan() {
    if (!activeProfile) return
    const plan = computeNutritionPlan(planForm)
    updatePlan(activeProfile.id, plan)
    setEditingPlan(false)

    // Si es la configuración inicial (no hay plan previo) o el peso ha cambiado,
    // guardar el peso en weight_log como punto de partida
    const isInitialSetup = !activeProfile.plan
    const weightChanged = activeProfile.plan && activeProfile.plan.weightKg !== planForm.weightKg
    if ((isInitialSetup || weightChanged) && planForm.weightKg > 0 && activeProfile.id) {
      const userId = activeProfile.id
      // Only insert if no entry exists for this week already
      const hasEntry = weightEntries.some(e => e.date === monday)
      if (!hasEntry) {
        try {
          await fetch('/api/weight', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date: monday, weightKg: planForm.weightKg }),
          })
          setWeightEntries(prev => {
            const filtered = prev.filter(e => e.date !== monday)
            return [...filtered, { date: monday, weight_kg: planForm.weightKg }].sort((a, b) => a.date.localeCompare(b.date))
          })
        } catch { /* silent */ }
      }
    }
  }

  // Weight handlers
  async function handleSaveWeight() {
    const w = parseFloat(weeklyWeightInput)
    if (!w || w < 30 || w > 300) return
    setWeightSaving(true)
    try {
      await fetch('/api/weight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, date: monday, weightKg: w }) })
      const newEntry = { date: monday, weight_kg: w }
      setWeightEntries(prev => {
        const filtered = prev.filter(e => e.date !== monday)
        return [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date))
      })
      setShowWeightPrompt(false)
      setWeeklyWeightInput('')
      if (pendingDayPrompt) {
        setPendingDayPrompt(false)
        setShowDayPrompt(true)
        setDayPromptStep('type')
      }
      // Update plan weight too
      if (activeProfile?.plan) updatePlan(activeProfile.id, { ...activeProfile.plan, weightKg: w })
    } catch { /* silent */ }
    finally { setWeightSaving(false) }
  }

  async function handleSaveCheatMeal(
    foodItems: { name: string; amount?: number; grams?: number; kcal: number; prot: number; carbs: number; grasa: number }[],
    totalKcal: number, totalProt: number, _note: string
  ) {
    setShowFoodSearch(false)
    if (foodSearchTarget === 'exception') {
      // Save as cheat day note + track full macros for current total
      const itemsStr = foodItems.map(i => `${i.name} (${i.amount ?? i.grams ?? ''})`).join(', ')
      const totalCarbs = foodItems.reduce((a, i) => a + (i.carbs || 0), 0)
      const totalGrasa = foodItems.reduce((a, i) => a + (i.grasa || 0), 0)
      setCheatMealData({ kcal: totalKcal, prot: totalProt, carbs: totalCarbs, grasa: totalGrasa, items: itemsStr })
      const fullNote = `${itemsStr} [${totalKcal} kcal]`
      setCheatNote(fullNote)
      await handleSaveCheatNote(fullNote)
    } else {
      // Save as a meal selection for a specific meal
      const mealId = foodSearchTarget
      const itemsStr = foodItems.map(i => `${i.name} (${i.amount ?? i.grams ?? ''})`).join(', ')
      const fakeOption = {
        id: 'cheat',
        name: `🍕 Cheat meal: ${itemsStr}`,
        kcal: totalKcal,
        prot: totalProt,
        carbs: foodItems.reduce((a, i) => a + i.carbs, 0),
        grasa: foodItems.reduce((a, i) => a + i.grasa, 0),
        type: 'ocasional' as const,
      }
      await handleSelect(mealId, fakeOption)
    }
  }

  async function loadHistoryDay(iso: string) {
    if (!userId || iso >= date) return // only past days
    setHistoryDate(iso)
    setHistoryData(null)
    setHistoryLoading(true)
    try {
      const r = await fetch(`/api/selections/log?userId=${userId}&date=${iso}`)
      const data = await r.json()
      setHistoryData(data)
    } catch { /* silent */ }
    finally { setHistoryLoading(false) }
  }

  const selectionsTotal = Object.values(selections).reduce((acc, s) => ({ kcal: acc.kcal + s.kcal, prot: acc.prot + s.prot, carbs: acc.carbs + s.carbs, grasa: acc.grasa + s.grasa }), { kcal: 0, prot: 0, carbs: 0, grasa: 0 })
  // Add exception cheat meal to totals (doesn't go through selections)
  const current = {
    kcal: selectionsTotal.kcal + (cheatMealData?.kcal ?? 0),
    prot: selectionsTotal.prot + (cheatMealData?.prot ?? 0),
    carbs: selectionsTotal.carbs + (cheatMealData?.carbs ?? 0),
    grasa: selectionsTotal.grasa + (cheatMealData?.grasa ?? 0),
  }

  // ── LOADING ──
  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-2 text-gray-400"><RefreshCw size={16} className="animate-spin" /><span className="text-sm">Preparando perfiles...</span></div>
    </div>
  )

  // ── PROFILE SELECTION SCREENS ──
  if (!activeProfile) {
    const selectedProfile = profiles.find(p => p.id === loginProfileId)

    // CREATE
    if (profileScreen === 'create') return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={() => { setProfileScreen('select'); setAuthError(null) }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronLeft size={16} />Volver
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Nuevo perfil</h1>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">Nombre</label>
              <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Tu nombre" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">PIN (4 dígitos)</label>
              <input value={profilePin} onChange={e => setProfilePin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="1234" type="password" inputMode="numeric" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">Elige tu avatar</label>
              <div className="grid grid-cols-4 gap-3">
                {AVATAR_OPTIONS.map(id => (
                  <button key={id} onClick={() => setSelectedAvatar(id)} className={`flex flex-col items-center p-2 rounded-xl border-2 transition-all ${selectedAvatar === id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                    <div className="w-12 h-12 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[id] }} />
                  </button>
                ))}
              </div>
            </div>
            {authError && <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>}
            <button onClick={handleCreateProfile} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Crear perfil y entrar</button>
          </div>
        </div>
      </div>
    )

    // DELETE
    if (profileScreen === 'delete') return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={() => { setProfileScreen('select'); setAuthError(null); setDeletePin(''); setDeleteTargetId('') }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronLeft size={16} />Volver
          </button>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Eliminar perfil</h1>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">Selecciona el perfil a eliminar e introduce su PIN. El PIN <span className="font-semibold text-gray-700 dark:text-gray-300">0000</span> elimina cualquier perfil.</p>
            <div className="grid grid-cols-2 gap-3">
              {profiles.map(p => (
                <button key={p.id} onClick={() => setDeleteTargetId(p.id)} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${deleteTargetId === p.id ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <div className="w-12 h-12 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[p.avatar] ?? '' }} />
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200">{p.name}</span>
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 block">PIN del perfil (o 0000)</label>
              <input value={deletePin} onChange={e => setDeletePin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="• • • •" type="password" inputMode="numeric" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white text-center tracking-widest" />
            </div>
            {authError && <p className="text-xs text-red-600 dark:text-red-400">{authError}</p>}
            <button onClick={handleDeleteProfile} className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors">Eliminar perfil</button>
          </div>
        </div>
      </div>
    )

    // LOGIN
    if (profileScreen === 'login' && selectedProfile) return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          <button onClick={() => { setProfileScreen('select'); setLoginPin(''); setAuthError(null) }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronLeft size={16} />Volver
          </button>
          <div className="flex flex-col items-center gap-3 mt-4">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-md" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[selectedProfile.avatar] ?? '' }} />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Hola, {selectedProfile.name}</h1>
          </div>
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm space-y-4">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block text-center">Introduce tu PIN</label>
            <input value={loginPin} onChange={e => setLoginPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="• • • •" type="password" inputMode="numeric" autoFocus
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white text-center text-lg tracking-widest"
              onKeyDown={e => { if (e.key === 'Enter') handleLogin() }} />
            {authError && <p className="text-xs text-red-600 dark:text-red-400 text-center">{authError}</p>}
            <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Acceder</button>
          </div>
        </div>
      </div>
    )

    // SELECT (default)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">¿Quién eres?</h1>
          <div className="grid grid-cols-2 gap-3">
            {profiles.map(p => (
              <button key={p.id} onClick={() => { setLoginProfileId(p.id); setLoginPin(''); setAuthError(null); setProfileScreen('login') }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm hover:border-blue-300 dark:hover:border-blue-600 transition-all">
                <div className="w-16 h-16 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[p.avatar] ?? '' }} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
              </button>
            ))}
            <button onClick={() => { setProfileName(''); setProfilePin(''); setSelectedAvatar(AVATAR_OPTIONS[0]); setAuthError(null); setProfileScreen('create') }}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-3xl text-gray-400">+</span>
              </div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Añadir perfil</span>
            </button>
          </div>
          {profiles.length > 0 && (
            <button onClick={() => { setDeleteTargetId(''); setDeletePin(''); setAuthError(null); setProfileScreen('delete') }}
              className="text-xs text-red-500 dark:text-red-400 hover:underline mx-auto block">
              Eliminar un perfil
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── INITIAL PLAN SETUP ──
  if (!activeProfile.plan) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[activeProfile.avatar] ?? '' }} />
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{activeProfile.name}</span>
          </div>
          <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Cerrar sesión</button>
        </div>
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-white">Configuración inicial</h2>
          <p className="text-xs text-gray-200 leading-relaxed">Estos datos se usan para calcular tu gasto calórico, tu objetivo diario de kcal y tus macros.</p>
          <PlanFormFields form={planForm} setForm={setPlanForm} />
          <button onClick={handleSavePlan} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar y continuar</button>
        </div>
      </div>
    </div>
  )

  // ── LOADING DAY DATA ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="flex items-center gap-2 text-gray-400"><RefreshCw size={16} className="animate-spin" /><span className="text-sm">Cargando...</span></div>
    </div>
  )

  // ── WEEKLY WEIGHT PROMPT (Monday) ──
  if (showWeightPrompt) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
      <div className="max-w-sm mx-auto px-4 w-full space-y-4">
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-4 text-center">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Scale size={28} className="text-blue-500" />
            </div>
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">¡Lunes de pesaje!</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Súbete a la báscula y apunta tu peso de esta semana.</p>
          </div>
          <input
            value={weeklyWeightInput}
            onChange={e => setWeeklyWeightInput(e.target.value.replace(',', '.'))}
            placeholder="Ej: 58.5"
            type="number" step="0.1" inputMode="decimal"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white text-center text-lg"
          />
          <div className="flex gap-2">
            <button onClick={() => {
              setShowWeightPrompt(false)
              if (pendingDayPrompt) {
                setPendingDayPrompt(false)
                setShowDayPrompt(true)
                setDayPromptStep('type')
              }
            }} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Ahora no
            </button>
            <button onClick={handleSaveWeight} disabled={weightSaving || !weeklyWeightInput}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {weightSaving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  // ── PROFILE / USER SCREEN ──
  if (appScreen === 'profile') {
    const latestWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight_kg : null
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 pt-3 pb-3">
        <div className="max-w-lg mx-auto">
          <button onClick={() => { setAppScreen('main'); setEditingPlan(false) }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ChevronLeft size={16} />Volver a comidas
          </button>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-10 space-y-4">
          {/* Profile header */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[activeProfile.avatar] ?? '' }} />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{activeProfile.name}</h1>
                {activeProfile.plan && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-1">
                    <p>{activeProfile.plan.sex === 'male' ? 'Hombre' : 'Mujer'} · {activeProfile.plan.age} años · {activeProfile.plan.heightCm} cm</p>
                    <p>Peso registrado: {latestWeight ? `${latestWeight} kg` : `${activeProfile.plan.weightKg} kg (inicial)`}</p>
                    <p>Objetivo: {activeProfile.plan.goal === 'gain' ? 'Ganar músculo' : activeProfile.plan.goal === 'loss' ? 'Perder grasa' : 'Mantener'}</p>
                    <p>Meta diaria: {activeProfile.plan.targetKcal} kcal · {activeProfile.plan.protein}g prot</p>
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => setEditingPlan(p => !p)} className="mt-3 text-xs text-blue-500 hover:underline">
              {editingPlan ? 'Cancelar edición' : 'Editar datos y objetivo'}
            </button>
          </div>

          {/* Edit plan form */}
          {editingPlan && (
            <div className="bg-gradient-to-b from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-semibold text-white">Editar datos</h2>
              <PlanFormFields form={planForm} setForm={setPlanForm} />
              <button onClick={handleSavePlan} className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">Guardar cambios</button>
            </div>
          )}

          {/* Weight chart */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Evolución del peso</h2>
              {weightEntries.length > 0 && (
                <span className="text-xs text-gray-400">{weightEntries.length} registro{weightEntries.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            <WeightChart entries={weightEntries} />
            {/* Manual weight entry */}
            <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400">Añadir registro de esta semana:</p>
              <div className="flex gap-2">
                <input value={weeklyWeightInput} onChange={e => setWeeklyWeightInput(e.target.value.replace(',', '.'))}
                  placeholder="58.5 kg" type="number" step="0.1" inputMode="decimal"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" />
                <button onClick={handleSaveWeight} disabled={weightSaving || !weeklyWeightInput}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {weightSaving ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>

          {/* Calendar in profile */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Historial del mes</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isTodayCompleted ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                Hoy: {isTodayCompleted ? 'completado' : `${selectedMeals}/${expectedMeals}`}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-2">
              {weekdayLabels.map(l => <div key={l} className="text-[10px] text-center text-gray-400 font-medium">{l}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((day, idx) => {
                if (!day) return <div key={`b${idx}`} className="h-9" />
                const iso = `${month}-${String(day).padStart(2, '0')}`
                const completed = completedDates.includes(iso)
                const cheated = cheatDates.includes(iso)
                const isToday = iso === date
                const isPast = iso < date
                const isOverKcal = isToday && current.kcal > computedTarget.kcal * 1.1
                const hasLog = loggedDates.includes(iso)
                const isPartial = isPast && hasLog && !completed && !cheated
                const isEmpty = isPast && !hasLog && !completed && !cheated
                return (
                  <button
                    key={iso}
                    onClick={() => { if (isPast) { setAppScreen('main'); loadHistoryDay(iso) } }}
                    className={`h-9 w-full rounded-lg text-xs flex items-center justify-center border transition-opacity ${isOverKcal ? 'bg-red-500 text-white border-red-500' : cheated ? 'bg-amber-500 text-white border-amber-500' : completed ? 'bg-emerald-500 text-white border-emerald-500' : isPartial ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : isEmpty ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700' : 'bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'} ${isToday ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''} ${isPast ? 'cursor-pointer active:opacity-70' : 'cursor-default'}`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />Completado</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />Excepción</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-blue-200 inline-block" />Parcial</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-gray-200 dark:bg-gray-700 inline-block" />Sin registrar</span>
              <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Kcal excedidas</span>
            </div>
          </div>

          <button onClick={handleLogout} className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // ── HISTORY DAY MODAL ──
  if (historyDate) {
    const hFormatted = new Date(historyDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
    // Reconstruct what was eaten that day
    const hDayType = (historyData?.log?.day_type ?? 'fuerza') as DayType
    const hSchedule = (historyData?.log?.schedule ?? 'tarde') as ScheduleType
    const hScheduleKey = (hDayType === 'descanso' || hDayType === 'cardio') ? 'main' : hSchedule
    const hRawData = DIET_DATA[hDayType]?.[hScheduleKey]
    const hDayData = hRawData && activeProfile?.plan ? scaleDayData(hRawData, activeProfile.plan.targetKcal) : hRawData
    const hSelections = historyData?.selections ?? []
    const hTotal = hSelections.reduce((acc, s) => ({ kcal: acc.kcal + s.kcal, prot: acc.prot + s.prot }), { kcal: 0, prot: 0 })
    const hCompleted = historyData?.log?.completed ?? false
    const hCheatNote = historyData?.log?.cheat_note ?? null

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 pt-3 pb-3">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => { setHistoryDate(null); setHistoryData(null) }} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
              <ChevronLeft size={16} />Volver
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize truncate">{hFormatted}</p>
            </div>
            {hCompleted && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium shrink-0">Completado</span>}
            {!hCompleted && historyData?.log && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 font-medium shrink-0">Parcial</span>}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 pt-4 pb-10 space-y-4">
          {historyLoading && (
            <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
              <RefreshCw size={16} className="animate-spin" /><span className="text-sm">Cargando...</span>
            </div>
          )}

          {!historyLoading && !historyData?.log && (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-center shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">No hay datos registrados para este día.</p>
            </div>
          )}

          {!historyLoading && historyData?.log && (
            <>
              {/* Summary card */}
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{hTotal.kcal}</p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{hTotal.prot}g</p>
                    <p className="text-xs text-gray-400">proteína</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{hSelections.length}/{hDayData?.meals.length ?? '?'}</p>
                    <p className="text-xs text-gray-400">tomas</p>
                  </div>
                </div>
                {hCheatNote && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      <span className="font-medium">Excepción: </span>{hCheatNote}
                    </p>
                  </div>
                )}
              </div>

              {/* Meals detail */}
              {hDayData && hDayData.meals.map(meal => {
                const sel = hSelections.find(s => s.meal_id === meal.id)
                const selectedOpt = sel ? meal.options.find(o => o.id === sel.option_id) : null
                return (
                  <div key={meal.id} className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden shadow-sm ${sel ? 'border-gray-100 dark:border-gray-800' : 'border-dashed border-gray-200 dark:border-gray-700 opacity-60'}`}>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{meal.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{meal.time}</p>
                      </div>
                      {sel ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs font-medium text-amber-600">{sel.kcal} kcal</span>
                          <span className="text-xs font-medium text-emerald-600">{sel.prot}g prot</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 shrink-0">No registrado</span>
                      )}
                    </div>
                    {selectedOpt && (
                      <div className="px-4 pb-3 border-t border-gray-50 dark:border-gray-800/50 pt-2">
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{selectedOpt.name.replace(/\[opcional\]/g, '')}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    )
  }

  // ── FOOD SEARCH MODAL ──
  // (rendered as overlay over any screen)

  // ── DAY TYPE PROMPT ──
  if (showDayPrompt) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="max-w-sm mx-auto px-4 w-full space-y-4">
          <div className="text-center space-y-1">
            <p className="text-xs text-gray-400 capitalize">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {dayPromptStep === 'type' ? '¿Qué tipo de día es hoy?' : '¿A qué hora entrenas?'}
            </h2>
          </div>

          {dayPromptStep === 'type' && (
            <div className="space-y-3">
              {([
                { value: 'fuerza' as DayType, label: 'Día de fuerza', desc: 'Entreno con pesas', emoji: '🏋️', color: 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' },
                { value: 'cardio' as DayType, label: 'Día de carrera', desc: 'Cardio / running', emoji: '🏃', color: 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300' },
                { value: 'descanso' as DayType, label: 'Día de descanso', desc: 'Sin entreno hoy', emoji: '😴', color: 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' },
              ] as { value: DayType; label: string; desc: string; emoji: string; color: string }[]).map(opt => (
                <button key={opt.value}
                  onClick={() => {
                    setDayPromptType(opt.value)
                    if (opt.value === 'fuerza') {
                      setDayPromptStep('schedule')
                    } else {
                      handleConfirmDayPrompt(opt.value, 'main')
                    }
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 text-left transition-all ${opt.color}`}
                >
                  <span className="text-3xl shrink-0">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs opacity-70 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {dayPromptStep === 'schedule' && (
            <div className="space-y-3">
              <button onClick={() => setDayPromptStep('type')}
                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-1">
                ← Volver
              </button>
              {([
                { value: 'tarde' as ScheduleType, label: 'Entreno a las 15h', desc: 'Carbos en comida y post', emoji: '☀️' },
                { value: 'manana' as ScheduleType, label: 'Primera hora', desc: 'Carbos en post y cena', emoji: '🌅' },
              ] as { value: ScheduleType; label: string; desc: string; emoji: string }[]).map(opt => (
                <button key={opt.value}
                  onClick={() => handleConfirmDayPrompt(dayPromptType, opt.value)}
                  className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300 dark:hover:border-blue-700 text-left transition-all"
                >
                  <span className="text-3xl shrink-0">{opt.emoji}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{opt.label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── MAIN SCREEN ──
  const dateFormatted = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 pt-3 pb-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mi dieta</h1>
            <p className="text-sm text-gray-400 capitalize">{dateFormatted}</p>
          </div>
          <div className="flex items-center gap-2">
            {saving && <div className="flex items-center gap-1 text-xs text-gray-400"><RefreshCw size={11} className="animate-spin" />Guardando</div>}
            <button onClick={() => setAppScreen('profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
              <div className="w-5 h-5 rounded-full overflow-hidden" dangerouslySetInnerHTML={{ __html: AVATAR_SVGS[activeProfile.avatar] ?? '' }} />
              <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{activeProfile.name}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="max-w-lg mx-auto px-4 pt-4 pb-10 space-y-4">
        {/* Day type summary — tap to change */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {dayType === 'fuerza' ? '🏋️' : dayType === 'cardio' ? '🏃' : '😴'}
            </span>
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {dayType === 'fuerza' ? 'Día de fuerza' : dayType === 'cardio' ? 'Día de carrera' : 'Día de descanso'}
                {dayType === 'fuerza' && (
                  <span className="text-xs font-normal text-gray-400 ml-1.5">
                    · {schedule === 'tarde' ? 'Entreno 15h' : 'Primera hora'}
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 capitalize">{dateFormatted}</p>
            </div>
          </div>
          <button onClick={handleChangeDayType}
            className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-1.5 hover:border-red-300 dark:hover:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
            Cambiar
          </button>
        </div>
        <MacroBar current={current} target={computedTarget} />

        {/* Status indicator — only show once at least one meal is selected */}
        {selectedMeals > 0 && (() => {
          const kcalPct = current.kcal / computedTarget.kcal
          const protPct = current.prot / computedTarget.prot
          const allSelected = selectedMeals === expectedMeals

          // Determine kcal status
          const kcalOver = kcalPct > 1.10
          const kcalOk = kcalPct >= 0.88 && kcalPct <= 1.10
          const kcalLow = kcalPct < 0.88

          // Determine protein status (stricter — protein matters most)
          const protOver = protPct > 1.15
          const protOk = protPct >= 0.85 && protPct <= 1.15
          const protLow = protPct < 0.85

          // Build messages
          const msgs: { text: string; color: string }[] = []

          if (allSelected) {
            if (kcalOver) msgs.push({ text: `Te pasas ${current.kcal - computedTarget.kcal} kcal del objetivo — considera opciones más ligeras`, color: 'text-red-600 dark:text-red-400' })
            else if (kcalLow) msgs.push({ text: `Te quedan ${computedTarget.kcal - current.kcal} kcal por cubrir — busca opciones más calóricas o añade algo extra`, color: 'text-blue-600 dark:text-blue-400' })
            else msgs.push({ text: `Kcal en rango correcto ✓`, color: 'text-emerald-600 dark:text-emerald-400' })

            if (protLow) msgs.push({ text: `Proteína baja (${current.prot}g de ${computedTarget.prot}g) — elige opciones con más proteína o añade un yogur / batido`, color: 'text-orange-600 dark:text-orange-400' })
            else if (protOk) msgs.push({ text: `Proteína en rango ✓`, color: 'text-emerald-600 dark:text-emerald-400' })
          } else {
            // Partial — estimate based on remaining meals
            const remaining = expectedMeals - selectedMeals
            const avgKcalPerMeal = selectedMeals > 0 ? current.kcal / selectedMeals : 0
            const projectedKcal = current.kcal + avgKcalPerMeal * remaining
            const projectedProt = current.prot + (current.prot / selectedMeals) * remaining

            if (avgKcalPerMeal > 0) {
              if (projectedKcal > computedTarget.kcal * 1.12)
                msgs.push({ text: `Ritmo alto — si sigues así superarás el objetivo calórico`, color: 'text-amber-600 dark:text-amber-400' })
              else if (projectedKcal < computedTarget.kcal * 0.85)
                msgs.push({ text: `Ritmo bajo — vas a quedarte por debajo del objetivo, elige opciones más completas`, color: 'text-blue-600 dark:text-blue-400' })
              else
                msgs.push({ text: `Vas bien encaminado`, color: 'text-emerald-600 dark:text-emerald-400' })

              if (projectedProt < computedTarget.prot * 0.85)
                msgs.push({ text: `La proteína va justa — prioriza opciones con más proteína en las tomas que quedan`, color: 'text-orange-600 dark:text-orange-400' })
            }
          }

          if (msgs.length === 0) return null

          return (
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl px-4 py-3 space-y-1.5">
              {msgs.map((m, i) => (
                <p key={i} className={`text-xs leading-relaxed ${m.color}`}>{m.text}</p>
              ))}
              <p className="text-[11px] text-gray-400 pt-0.5">Meta: {computedTarget.kcal} kcal · {computedTarget.prot}g prot · {activeProfile.plan.goal === 'gain' ? 'ganancia muscular' : activeProfile.plan.goal === 'loss' ? 'pérdida de grasa' : 'mantenimiento'}</p>
            </div>
          )
        })()}

        {errorMsg && <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{errorMsg}</div>}
        {dayData.dayNote && <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 leading-relaxed">{dayData.dayNote}</div>}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm"><Timeline items={dayData.timeline} /></div>

        {/* Cheat meal / excepción */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Día con excepción</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">¿Te saltaste la dieta? Registra lo que comiste.</p>
            </div>
            <button
              onClick={() => { setFoodSearchTarget('exception'); setShowFoodSearch(true) }}
              className="text-xs px-3 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <span>🍕</span> Añadir alimento
            </button>
          </div>
          {cheatMealData && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5 space-y-1">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{cheatMealData.items}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-600 dark:text-amber-400">{cheatMealData.kcal} kcal · {cheatMealData.prot}g prot</p>
                <button onClick={() => { setCheatMealData(null); setCheatNote(''); handleSaveCheatNote('') }} className="text-xs text-amber-500 hover:text-red-500 transition-colors">Quitar</button>
              </div>
            </div>
          )}
        </div>

        {/* Food search modal */}
        {showFoodSearch && (
          <FoodSearchModal
            onClose={() => setShowFoodSearch(false)}
            onSave={handleSaveCheatMeal}
            initialNote={cheatNote}
          />
        )}

        {/* Meals */}
        <div className="space-y-3">
          {dayData.meals.map(meal => (
            <MealCard
              key={meal.id}
              meal={meal}
              selectedOptionId={selections[meal.id]?.option_id ?? null}
              onSelect={opt => handleSelect(meal.id, opt)}
              onDeselect={() => handleDeselect(meal.id)}
              onCheatMeal={() => { setFoodSearchTarget(meal.id); setShowFoodSearch(true) }}
            />
          ))}
        </div>
        <div className="h-16" />
      </div>
    </div>
  )
}

// ── PLAN FORM SUBCOMPONENT ──
function PlanFormFields({ form, setForm }: { form: typeof defaultPlanForm; setForm: React.Dispatch<React.SetStateAction<typeof defaultPlanForm>> }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-white">
          Edad
          <input type="number" min="1" value={form.age || ''} onChange={e => setForm(p => ({ ...p, age: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} onFocus={e => { if (e.target.value === '0') e.target.select() }} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-white">
          Estatura (cm)
          <input type="number" min="1" value={form.heightCm || ''} onChange={e => setForm(p => ({ ...p, heightCm: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} onFocus={e => { if (e.target.value === '0') e.target.select() }} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-white">
          Peso actual (kg)
          <input type="number" min="1" step="0.1" value={form.weightKg || ''} onChange={e => setForm(p => ({ ...p, weightKg: e.target.value === '' ? 0 : parseFloat(e.target.value) }))} onFocus={e => { if (e.target.value === '0') e.target.select() }} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
        </label>
        <label className="text-xs text-white">
          Días entreno/semana
          <input type="number" min="0" max="7" value={form.trainingDays === 0 ? '' : form.trainingDays} onChange={e => setForm(p => ({ ...p, trainingDays: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} onFocus={e => { if (e.target.value === '0') e.target.select() }} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white" />
        </label>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-white">
          Sexo
          <select value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value as SexType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white">
            <option value="male">Hombre</option><option value="female">Mujer</option>
          </select>
        </label>
        <label className="text-xs text-white">
          Actividad
          <select value={form.activity} onChange={e => setForm(p => ({ ...p, activity: e.target.value as ActivityType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white">
            <option value="low">Baja</option><option value="medium">Media</option><option value="high">Alta</option>
          </select>
        </label>
        <label className="text-xs text-white">
          Objetivo
          <select value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value as GoalType }))} className="mt-1 w-full rounded-xl border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-white">
            <option value="loss">Perder grasa</option><option value="gain">Ganar músculo</option><option value="maintain">Mantener</option>
          </select>
        </label>
      </div>
      <div className="rounded-xl bg-gray-800/70 border border-gray-700 px-3 py-2 text-[11px] text-gray-300 leading-relaxed space-y-0.5">
        <p><span className="font-semibold text-white">Baja:</span> vida sedentaria o 0-2 entrenos/semana.</p>
        <p><span className="font-semibold text-white">Media:</span> 3-4 entrenos/semana y actividad normal.</p>
        <p><span className="font-semibold text-white">Alta:</span> 5-7 entrenos/semana o trabajo físico.</p>
      </div>
    </div>
  )
}
