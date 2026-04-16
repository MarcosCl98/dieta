'use client'

import { DayType, ScheduleType } from '@/lib/data'
import { Dumbbell, Wind, Moon } from 'lucide-react'

interface DaySelectorProps {
  dayType: DayType
  schedule: ScheduleType
  onDayType: (d: DayType) => void
  onSchedule: (s: ScheduleType) => void
}

const DAY_OPTIONS: { value: DayType; label: string; icon: React.ReactNode; color: string; active: string }[] = [
  {
    value: 'fuerza',
    label: 'Fuerza',
    icon: <Dumbbell size={16} />,
    color: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-blue-200',
    active: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-600 text-blue-700 dark:text-blue-300',
  },
  {
    value: 'cardio',
    label: 'Carrera',
    icon: <Wind size={16} />,
    color: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-emerald-200',
    active: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-600 text-emerald-700 dark:text-emerald-300',
  },
  {
    value: 'descanso',
    label: 'Descanso',
    icon: <Moon size={16} />,
    color: 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-purple-200',
    active: 'border-purple-400 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-600 text-purple-700 dark:text-purple-300',
  },
]

export function DaySelector({ dayType, schedule, onDayType, onSchedule }: DaySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {DAY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDayType(opt.value)}
            className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
              dayType === opt.value ? opt.active : opt.color
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {dayType === 'fuerza' && (
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'tarde' as ScheduleType, label: 'Entreno 15h' },
            { value: 'manana' as ScheduleType, label: 'Primera hora' },
          ].map((s) => (
            <button
              key={s.value}
              onClick={() => onSchedule(s.value)}
              className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
                schedule === s.value
                  ? 'border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
