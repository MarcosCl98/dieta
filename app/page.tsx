'use client'

import { useCallback, useEffect, useState } from 'react'
import { DayType, DIET_DATA, Option, ScheduleType } from '@/lib/data'
import { useUserId } from '@/lib/useUserId'
import { MacroBar } from '@/components/MacroBar'
import { MealCard } from '@/components/MealCard'
import { DaySelector } from '@/components/DaySelector'
import { Timeline } from '@/components/Timeline'
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

  return { year, month, cells }
}

interface Selection {
  meal_id: string
  option_id: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
}

export default function HomePage() {
  const { userId, ready } = useUserId()
  const [dayType, setDayType] = useState<DayType>('fuerza')
  const [schedule, setSchedule] = useState<ScheduleType>('tarde')
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [completedDates, setCompletedDates] = useState<string[]>([])
  const [cheatDates, setCheatDates] = useState<string[]>([])
  const [cheatNote, setCheatNote] = useState('')

  const date = todayISO()
  const month = monthISO()

  // Resolve active data — cardio and descanso always use 'main'
  const scheduleKey = (dayType === 'descanso' || dayType === 'cardio') ? 'main' : schedule
  const dayData = DIET_DATA[dayType][scheduleKey]
  const expectedMeals = dayData.meals.length
  const selectedMeals = Object.keys(selections).length
  const isTodayCompleted = selectedMeals === expectedMeals && expectedMeals > 0
  const { cells } = buildCalendarDays()
  const weekdayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

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

  // Load saved state for today — wait until userId is ready from localStorage
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
          for (const s of data.selections) {
            map[s.meal_id] = s
          }
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
      if (previousSelection) {
        setSelections((prev) => ({ ...prev, [mealId]: previousSelection }))
      }
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

  // Compute totals
  const current = Object.values(selections).reduce(
    (acc, s) => ({
      kcal: acc.kcal + s.kcal,
      prot: acc.prot + s.prot,
      carbs: acc.carbs + s.carbs,
      grasa: acc.grasa + s.grasa,
    }),
    { kcal: 0, prot: 0, carbs: 0, grasa: 0 }
  )

  const dateFormatted = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

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
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Mi dieta</h1>
            <p className="text-sm text-gray-400 capitalize">{dateFormatted}</p>
          </div>
          {saving && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <RefreshCw size={12} className="animate-spin" />
              Guardando
            </div>
          )}
        </div>

        {/* Day selector */}
        <DaySelector
          dayType={dayType}
          schedule={schedule}
          onDayType={handleDayType}
          onSchedule={handleSchedule}
        />

        {/* Macro bar */}
        <MacroBar current={current} target={dayData.macros} />

        {/* Error */}
        {errorMsg && (
          <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 leading-relaxed">
            {errorMsg}
          </div>
        )}
        {/* Day note */}
        {dayData.dayNote && (
          <div className="text-sm text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 leading-relaxed">
            {dayData.dayNote}
          </div>
        )}

        {/* Timeline */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <Timeline items={dayData.timeline} />
        </div>

        {/* Completion calendar */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Calendario de cumplimiento</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isTodayCompleted
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
            }`}>
              Hoy: {isTodayCompleted ? 'completado' : `${selectedMeals}/${expectedMeals}`}
            </span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {weekdayLabels.map((label) => (
              <div key={label} className="text-[10px] text-center text-gray-400 font-medium">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} className="h-8" />
              const dayISO = `${month}-${String(day).padStart(2, '0')}`
              const completed = completedDates.includes(dayISO)
              const cheated = cheatDates.includes(dayISO)
              const isToday = dayISO === date
              return (
                <div
                  key={dayISO}
                  className={`h-8 rounded-lg text-xs flex items-center justify-center border ${
                    cheated
                      ? 'bg-amber-500 text-white border-amber-500'
                      : completed
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-700'
                  } ${isToday ? 'ring-1 ring-blue-300 dark:ring-blue-700' : ''}`}
                >
                  {day}
                </div>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 mt-2">
            Verde: dieta cumplida. Naranja: día con excepción.
          </p>
        </div>

        {/* Cheat note */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm space-y-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Día con excepción</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Si hoy te saliste de la dieta, apunta con qué fue (ej: pizza, helado, cena fuera).
          </p>
          <input
            value={cheatNote}
            onChange={(e) => setCheatNote(e.target.value)}
            placeholder="Ejemplo: hamburguesa y patatas"
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300 dark:focus:ring-amber-700"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                handleSaveCheatNote()
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Guardar excepción
            </button>
            <button
              onClick={() => {
                setCheatNote('')
                handleSaveCheatNote('')
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Quitar marca
            </button>
          </div>
        </div>

        {/* Meals */}
        <div className="space-y-3">
          {dayData.meals.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              selectedOptionId={selections[meal.id]?.option_id ?? null}
              onSelect={(opt) => handleSelect(meal.id, opt)}
              onDeselect={() => handleDeselect(meal.id)}
            />
          ))}
        </div>

        {/* Bottom padding for mobile */}
        <div className="h-8" />
      </div>
    </div>
  )
}
