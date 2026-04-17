'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, RefreshCw, Plus, AlertCircle } from 'lucide-react'

interface FoodResult {
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  source: string
  per100g: { kcal: number; prot: number; carbs: number; grasa: number }
}

interface FoodItem {
  name: string
  grams: number
  kcal: number
  prot: number
  carbs: number
  grasa: number
}

interface FoodSearchModalProps {
  onClose: () => void
  onSave: (items: FoodItem[], totalKcal: number, totalProt: number, note: string) => void
  initialNote?: string
}

export function FoodSearchModal({ onClose, onSave, initialNote = '' }: FoodSearchModalProps) {
  const [query, setQuery] = useState('')
  const [grams, setGrams] = useState('100')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<FoodResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [items, setItems] = useState<FoodItem[]>([])
  const [note, setNote] = useState(initialNote)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const total = items.reduce((acc, i) => ({ kcal: acc.kcal + i.kcal, prot: acc.prot + i.prot }), { kcal: 0, prot: 0 })

  async function handleSearch() {
    const q = query.trim()
    const g = parseInt(grams, 10)
    if (!q || !g || g <= 0) return
    setSearching(true)
    setResult(null)
    setNotFound(false)
    try {
      const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}&g=${g}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) { setNotFound(true); return }
      setResult(await res.json())
    } catch {
      setNotFound(true)
    } finally {
      setSearching(false)
    }
  }

  function handleAdd() {
    if (!result) return
    const g = parseInt(grams, 10)
    setItems(prev => [...prev, {
      name: result.name.length > 50 ? result.name.slice(0, 50) + '…' : result.name,
      grams: g,
      kcal: result.kcal,
      prot: result.prot,
      carbs: result.carbs,
      grasa: result.grasa,
    }])
    setResult(null)
    setQuery('')
    setGrams('100')
    inputRef.current?.focus()
  }

  function handleRemove(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    onSave(items, total.kcal, total.prot, note)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Buscar alimento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Introduce el alimento y los gramos</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Search inputs */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setNotFound(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Ej: pechuga de pollo, arroz..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            <div className="relative w-24 shrink-0">
              <input
                value={grams}
                onChange={e => { setGrams(e.target.value.replace(/\D/g, '')); setResult(null) }}
                onFocus={e => e.target.select()}
                placeholder="100"
                type="number"
                min="1"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white pr-7"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none">g</span>
            </div>
          </div>

          <button
            onClick={handleSearch}
            disabled={searching || !query.trim() || !grams}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {searching ? <><RefreshCw size={15} className="animate-spin" />Buscando...</> : <><Search size={15} />Buscar</>}
          </button>

          {/* Result */}
          {notFound && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                No se encontró ese alimento. Prueba con otro nombre (en inglés también funciona) o con un término más genérico.
              </p>
            </div>
          )}

          {result && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{result.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{grams}g · vía {result.source}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Kcal', value: result.kcal, color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Prot', value: `${result.prot}g`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Carbs', value: `${result.carbs}g`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Grasa', value: `${result.grasa}g`, color: 'text-gray-500 dark:text-gray-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-gray-800 rounded-lg py-2">
                    <p className={`text-sm font-semibold ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-gray-400">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">Por 100g: {result.per100g.kcal} kcal · {result.per100g.prot}g prot · {result.per100g.carbs}g carbs · {result.per100g.grasa}g grasa</p>
              <button onClick={handleAdd} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} />Añadir a la lista
              </button>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Alimentos añadidos</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.grams}g · {item.kcal} kcal · {item.prot}g prot</p>
                  </div>
                  <button onClick={() => handleRemove(idx)} className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              {/* Total */}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total</span>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-amber-600">{total.kcal} kcal</span>
                  <span className="text-xs font-semibold text-emerald-600">{total.prot}g prot</span>
                </div>
              </div>
            </div>
          )}

          {/* Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nota (opcional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Ej: pizza margarita y coca-cola"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={items.length === 0 && !note.trim()}
            className="flex-2 flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {items.length > 0 ? `Guardar (${total.kcal} kcal)` : 'Guardar nota'}
          </button>
        </div>
      </div>
    </div>
  )
}
