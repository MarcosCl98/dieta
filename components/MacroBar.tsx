'use client'

interface MacroBarProps {
  current: { kcal: number; prot: number; carbs: number; grasa: number }
  target: { kcal: number; prot: number; carbs: number; grasa: number }
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  const over = value > max
  return (
    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all duration-500 ${over ? 'bg-red-400' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export function MacroBar({ current, target }: MacroBarProps) {
  const kcalPct = Math.round((current.kcal / target.kcal) * 100)

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 shadow-sm">
      <div className="flex items-end justify-between mb-3">
        <div>
          <span className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
            {current.kcal}
          </span>
          <span className="text-sm text-gray-400 ml-1">/ {target.kcal} kcal</span>
        </div>
        <span
          className={`text-sm font-medium px-2 py-0.5 rounded-full ${
            kcalPct >= 100
              ? 'bg-red-50 text-red-500 dark:bg-red-900/30'
              : kcalPct >= 80
              ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30'
              : 'bg-green-50 text-green-600 dark:bg-green-900/30'
          }`}
        >
          {kcalPct}%
        </span>
      </div>

      <Bar value={current.kcal} max={target.kcal} color="bg-amber-400" />

      <div className="grid grid-cols-3 gap-3 mt-4">
        {[
          { label: 'Proteína', value: current.prot, max: target.prot, unit: 'g', color: 'bg-emerald-400' },
          { label: 'Carbos', value: current.carbs, max: target.carbs, unit: 'g', color: 'bg-blue-400' },
          { label: 'Grasa', value: current.grasa, max: target.grasa, unit: 'g', color: 'bg-orange-400' },
        ].map((m) => (
          <div key={m.label}>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{m.label}</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {m.value}{m.unit}
                <span className="text-gray-400"> / {m.max}{m.unit}</span>
              </span>
            </div>
            <Bar value={m.value} max={m.max} color={m.color} />
          </div>
        ))}
      </div>
    </div>
  )
}
