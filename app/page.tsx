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

  const date = todayISO()

  // Resolve active data — cardio and descanso always use 'main'
  const scheduleKey = (dayType === 'descanso' || dayType === 'cardio') ? 'main' : schedule
  const dayData = DIET_DATA[dayType][scheduleKey]

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

  // Save day type/schedule when changed
  const saveDayLog = useCallback(
    async (dt: DayType, sc: ScheduleType) => {
      if (!ready || !userId) return
      await fetch('/api/selections/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, date, dayType: dt, schedule: sc }),
      })
    },
    [ready, userId, date]
  )

  function handleDayType(dt: DayType) {
    setDayType(dt)
    setSelections({})
    saveDayLog(dt, schedule)
  }

  function handleSchedule(sc: ScheduleType) {
    setSchedule(sc)
    setSelections({})
    saveDayLog(dayType, sc)
  }

  async function handleSelect(mealId: string, option: Option) {
    if (!ready || !userId) return
    setSaving(true)
    const sel: Selection = {
      meal_id: mealId,
      option_id: option.id,
      kcal: option.kcal,
      prot: option.prot,
      carbs: option.carbs,
      grasa: option.grasa,
    }
    setSelections((prev) => ({ ...prev, [mealId]: sel }))

    await fetch('/api/selections/meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, mealId, optionId: option.id, ...sel }),
    })
    setSaving(false)
  }

  async function handleDeselect(mealId: string) {
    if (!ready || !userId) return
    setSaving(true)
    setSelections((prev) => {
      const next = { ...prev }
      delete next[mealId]
      return next
    })

    await fetch('/api/selections/meal', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, mealId }),
    })
    setSaving(false)
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
