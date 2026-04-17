'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, RefreshCw, Plus, AlertCircle, ChevronRight } from 'lucide-react'

interface FoodResult {
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  source: string
  per100g: { kcal: number; prot: number; carbs: number; grasa: number }
}

interface Candidate {
  id: string
  name: string
  brand: string | null
  description: string | null
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

// ── Local reference table (per 100g) ──
const REF: Record<string, { kcal: number; prot: number; carbs: number; grasa: number; label: string }> = {
  'pechuga de pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo' },
  'pechuga pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo' },
  'pollo': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo' },
  'pollo asado': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo asado' },
  'pavo': { kcal: 135, prot: 29, carbs: 0, grasa: 1.5, label: 'Pechuga de pavo' },
  'ternera': { kcal: 250, prot: 26, carbs: 0, grasa: 17, label: 'Ternera' },
  'solomillo': { kcal: 180, prot: 28, carbs: 0, grasa: 7, label: 'Solomillo' },
  'carne picada': { kcal: 254, prot: 26, carbs: 0, grasa: 17, label: 'Carne picada' },
  'cerdo': { kcal: 242, prot: 27, carbs: 0, grasa: 14, label: 'Cerdo' },
  'cerdo iberico': { kcal: 280, prot: 25, carbs: 0, grasa: 20, label: 'Cerdo ibérico' },
  'jamon serrano': { kcal: 241, prot: 30, carbs: 0, grasa: 13, label: 'Jamón serrano' },
  'jamon cocido': { kcal: 120, prot: 18, carbs: 1, grasa: 5, label: 'Jamón cocido' },
  'salmon': { kcal: 208, prot: 20, carbs: 0, grasa: 13, label: 'Salmón' },
  'merluza': { kcal: 86, prot: 17, carbs: 0, grasa: 2, label: 'Merluza' },
  'atun': { kcal: 132, prot: 28, carbs: 0, grasa: 1, label: 'Atún' },
  'bacalao': { kcal: 82, prot: 18, carbs: 0, grasa: 0.7, label: 'Bacalao' },
  'huevo': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero' },
  'huevo entero': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero' },
  'clara de huevo': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo' },
  'claras': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo' },
  'leche entera': { kcal: 61, prot: 3.2, carbs: 4.8, grasa: 3.3, label: 'Leche entera' },
  'leche desnatada': { kcal: 35, prot: 3.4, carbs: 4.9, grasa: 0.2, label: 'Leche desnatada' },
  'leche': { kcal: 42, prot: 3.4, carbs: 4.8, grasa: 1, label: 'Leche semidesnatada' },
  'yogur natural': { kcal: 59, prot: 3.5, carbs: 4.7, grasa: 3.3, label: 'Yogur natural' },
  'yogur griego': { kcal: 97, prot: 9, carbs: 3.6, grasa: 5, label: 'Yogur griego' },
  'skyr': { kcal: 63, prot: 11, carbs: 4, grasa: 0.2, label: 'Skyr' },
  'queso': { kcal: 402, prot: 25, carbs: 1.3, grasa: 33, label: 'Queso' },
  'mozzarella': { kcal: 280, prot: 28, carbs: 2.2, grasa: 17, label: 'Mozzarella' },
  'requesón': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Requesón' },
  'cottage': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Cottage cheese' },
  'avena': { kcal: 389, prot: 17, carbs: 66, grasa: 7, label: 'Avena' },
  'arroz blanco': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz cocido' },
  'arroz': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz cocido' },
  'arroz crudo': { kcal: 365, prot: 7, carbs: 79, grasa: 0.7, label: 'Arroz crudo' },
  'pasta': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Pasta cocida' },
  'pasta integral': { kcal: 124, prot: 5.3, carbs: 23, grasa: 1.2, label: 'Pasta integral cocida' },
  'pasta cruda': { kcal: 371, prot: 13, carbs: 74, grasa: 1.5, label: 'Pasta cruda' },
  'gnocchi': { kcal: 130, prot: 3, carbs: 27, grasa: 0.5, label: 'Gnocchi' },
  'pan blanco': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan blanco' },
  'pan integral': { kcal: 247, prot: 13, carbs: 41, grasa: 4, label: 'Pan integral' },
  'pan': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan' },
  'patata': { kcal: 77, prot: 2, carbs: 17, grasa: 0.1, label: 'Patata cocida' },
  'boniato': { kcal: 86, prot: 1.6, carbs: 20, grasa: 0.1, label: 'Boniato cocido' },
  'quinoa': { kcal: 120, prot: 4.4, carbs: 22, grasa: 1.9, label: 'Quinoa cocida' },
  'lentejas': { kcal: 116, prot: 9, carbs: 20, grasa: 0.4, label: 'Lentejas cocidas' },
  'garbanzos': { kcal: 164, prot: 9, carbs: 27, grasa: 2.6, label: 'Garbanzos cocidos' },
  'brocoli': { kcal: 34, prot: 2.8, carbs: 7, grasa: 0.4, label: 'Brócoli' },
  'espinacas': { kcal: 23, prot: 2.9, carbs: 3.6, grasa: 0.4, label: 'Espinacas' },
  'tomate': { kcal: 18, prot: 0.9, carbs: 3.9, grasa: 0.2, label: 'Tomate' },
  'lechuga': { kcal: 15, prot: 1.4, carbs: 2.9, grasa: 0.2, label: 'Lechuga' },
  'pepino': { kcal: 16, prot: 0.7, carbs: 3.6, grasa: 0.1, label: 'Pepino' },
  'zanahoria': { kcal: 41, prot: 0.9, carbs: 10, grasa: 0.2, label: 'Zanahoria' },
  'cebolla': { kcal: 40, prot: 1.1, carbs: 9.3, grasa: 0.1, label: 'Cebolla' },
  'pimiento': { kcal: 31, prot: 1, carbs: 6, grasa: 0.3, label: 'Pimiento' },
  'champiñones': { kcal: 22, prot: 3.1, carbs: 3.3, grasa: 0.3, label: 'Champiñones' },
  'esparragos': { kcal: 20, prot: 2.2, carbs: 3.7, grasa: 0.1, label: 'Espárragos' },
  'aguacate': { kcal: 160, prot: 2, carbs: 9, grasa: 15, label: 'Aguacate' },
  'platano': { kcal: 89, prot: 1.1, carbs: 23, grasa: 0.3, label: 'Plátano' },
  'manzana': { kcal: 52, prot: 0.3, carbs: 14, grasa: 0.2, label: 'Manzana' },
  'naranja': { kcal: 47, prot: 0.9, carbs: 12, grasa: 0.1, label: 'Naranja' },
  'arandanos': { kcal: 57, prot: 0.7, carbs: 14, grasa: 0.3, label: 'Arándanos' },
  'fresas': { kcal: 32, prot: 0.7, carbs: 8, grasa: 0.3, label: 'Fresas' },
  'kiwi': { kcal: 61, prot: 1.1, carbs: 15, grasa: 0.5, label: 'Kiwi' },
  'mandarina': { kcal: 53, prot: 0.8, carbs: 13, grasa: 0.3, label: 'Mandarina' },
  'aceite de oliva': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'Aceite de oliva' },
  'mantequilla': { kcal: 717, prot: 0.9, carbs: 0.1, grasa: 81, label: 'Mantequilla' },
  'mantequilla cacahuete': { kcal: 588, prot: 25, carbs: 20, grasa: 50, label: 'Mantequilla de cacahuete' },
  'almendras': { kcal: 579, prot: 21, carbs: 22, grasa: 50, label: 'Almendras' },
  'nueces': { kcal: 654, prot: 15, carbs: 14, grasa: 65, label: 'Nueces' },
  'miel': { kcal: 304, prot: 0.3, carbs: 82, grasa: 0, label: 'Miel' },
  'whey': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Whey protein' },
  'proteina polvo': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Proteína en polvo' },
  'pizza': { kcal: 266, prot: 11, carbs: 33, grasa: 10, label: 'Pizza' },
  'hamburguesa': { kcal: 295, prot: 17, carbs: 24, grasa: 14, label: 'Hamburguesa' },
  'tortilla de patatas': { kcal: 218, prot: 8, carbs: 18, grasa: 13, label: 'Tortilla de patatas' },
  'tortilla patatas': { kcal: 218, prot: 8, carbs: 18, grasa: 13, label: 'Tortilla de patatas' },
  'chocolate negro': { kcal: 546, prot: 5, carbs: 60, grasa: 31, label: 'Chocolate negro' },
  'chocolate': { kcal: 546, prot: 5, carbs: 60, grasa: 31, label: 'Chocolate' },
  'helado': { kcal: 207, prot: 3.5, carbs: 24, grasa: 11, label: 'Helado' },
  'cerveza': { kcal: 43, prot: 0.5, carbs: 3.6, grasa: 0, label: 'Cerveza' },
  'vino': { kcal: 85, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Vino' },
  'coca cola': { kcal: 42, prot: 0, carbs: 11, grasa: 0, label: 'Coca-Cola' },
  'refresco': { kcal: 42, prot: 0, carbs: 11, grasa: 0, label: 'Refresco' },
  'patatas fritas': { kcal: 536, prot: 7, carbs: 53, grasa: 35, label: 'Patatas fritas' },
  'croissant': { kcal: 406, prot: 8, carbs: 46, grasa: 21, label: 'Croissant' },
  'pan de molde': { kcal: 265, prot: 8, carbs: 49, grasa: 4, label: 'Pan de molde' },
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function searchLocal(query: string): FoodResult | null {
  const q = normalize(query)
  // Exact match
  for (const [key, val] of Object.entries(REF)) {
    if (normalize(key) === q) {
      return { name: val.label, kcal: 0, prot: 0, carbs: 0, grasa: 0, source: 'Referencia', per100g: val }
    }
  }
  // Partial match
  for (const [key, val] of Object.entries(REF)) {
    const k = normalize(key)
    if (q.includes(k) || k.includes(q)) {
      return { name: val.label, kcal: 0, prot: 0, carbs: 0, grasa: 0, source: 'Referencia', per100g: val }
    }
  }
  return null
}

// ── Open Food Facts — called client-side, no server needed ──
async function searchOFF(query: string): Promise<Candidate[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=id,product_name,brands,nutriments&sort_by=unique_scans_n`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const products = (data.products ?? []) as Array<{
      id?: string; _id?: string; product_name?: string; brands?: string; nutriments?: Record<string, number>
    }>
    return products
      .filter(p => {
        const n = p.nutriments ?? {}
        const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)
        return p.product_name && kcal > 0
      })
      .map(p => ({
        id: `off:${p.id ?? p._id}`,
        name: p.product_name!,
        brand: p.brands ?? null,
        description: null,
        nutriments: p.nutriments,
      }))
  } catch { return [] }
}

function offResultToFoodResult(candidate: Candidate & { nutriments?: Record<string, number> }, grams: number): FoodResult | null {
  const n = candidate.nutriments ?? {}
  const kcal100 = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : null)
  const prot100 = n['proteins_100g']
  const carbs100 = n['carbohydrates_100g']
  const fat100 = n['fat_100g']
  if (!kcal100) return null
  const f = grams / 100
  return {
    name: candidate.brand ? `${candidate.name} (${candidate.brand})` : candidate.name,
    kcal: Math.round(kcal100 * f),
    prot: Math.round((prot100 ?? 0) * f * 10) / 10,
    carbs: Math.round((carbs100 ?? 0) * f * 10) / 10,
    grasa: Math.round((fat100 ?? 0) * f * 10) / 10,
    source: 'Open Food Facts',
    per100g: {
      kcal: Math.round(kcal100),
      prot: Math.round((prot100 ?? 0) * 10) / 10,
      carbs: Math.round((carbs100 ?? 0) * 10) / 10,
      grasa: Math.round((fat100 ?? 0) * 10) / 10,
    }
  }
}

function applyGrams(r: FoodResult, grams: number): FoodResult {
  const f = grams / 100
  return {
    ...r,
    kcal: Math.round(r.per100g.kcal * f),
    prot: Math.round(r.per100g.prot * f * 10) / 10,
    carbs: Math.round(r.per100g.carbs * f * 10) / 10,
    grasa: Math.round(r.per100g.grasa * f * 10) / 10,
  }
}

export function FoodSearchModal({ onClose, onSave, initialNote = '' }: FoodSearchModalProps) {
  const [query, setQuery] = useState('')
  const [grams, setGrams] = useState('100')
  const [unit, setUnit] = useState<'g' | 'ml'>('g')
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<(Candidate & { nutriments?: Record<string, number> })[]>([])
  const [result, setResult] = useState<FoodResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [items, setItems] = useState<FoodItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const total = items.reduce((acc, i) => ({ kcal: acc.kcal + i.kcal, prot: acc.prot + i.prot }), { kcal: 0, prot: 0 })
  const gramsNum = parseFloat(grams) || 100

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setResult(null)
    setCandidates([])
    setNotFound(false)

    // 1. Local reference (instant)
    const local = searchLocal(q)
    if (local) { setResult(applyGrams(local, gramsNum)); setSearching(false); return }

    // 2. Open Food Facts client-side
    const offResults = await searchOFF(q)
    if (offResults.length === 1) {
      const r = offResultToFoodResult(offResults[0], gramsNum)
      if (r) { setResult(r); setSearching(false); return }
    } else if (offResults.length > 1) {
      setCandidates(offResults)
      setSearching(false)
      return
    }

    setNotFound(true)
    setSearching(false)
  }

  function selectCandidate(c: Candidate & { nutriments?: Record<string, number> }) {
    const r = offResultToFoodResult(c, gramsNum)
    if (r) { setResult(r); setCandidates([]) }
  }

  function handleAdd() {
    if (!result) return
    setItems(prev => [...prev, {
      name: result.name.length > 50 ? result.name.slice(0, 50) + '…' : result.name,
      grams: gramsNum,
      kcal: result.kcal,
      prot: result.prot,
      carbs: result.carbs,
      grasa: result.grasa,
    }])
    setResult(null)
    setQuery('')
    setGrams('100')
    setUnit('g')
    setNotFound(false)
    setCandidates([])
    inputRef.current?.focus()
  }

  const suggestions = query.length >= 2
    ? Object.values(REF).filter(v =>
        normalize(v.label).includes(normalize(query))
      ).slice(0, 5)
    : []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Añadir alimento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Escribe el alimento y la cantidad</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Search row */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setCandidates([]); setNotFound(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Ej: pechuga de pollo, pizza..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {/* Amount + unit */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0">
              <input
                value={grams}
                onChange={e => { setGrams(e.target.value.replace(/[^\d.]/g, '')); setResult(null) }}
                onFocus={e => e.target.select()}
                type="number"
                min="1"
                className="w-16 px-3 py-3 text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none"
              />
              <div className="flex flex-col border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setUnit('g')}
                  className={`flex-1 px-2 text-xs font-medium transition-colors ${unit === 'g' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  g
                </button>
                <button
                  onClick={() => setUnit('ml')}
                  className={`flex-1 px-2 text-xs font-medium border-t border-gray-200 dark:border-gray-700 transition-colors ${unit === 'ml' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  ml
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !result && candidates.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s.label} onClick={() => { setQuery(s.label); setResult(null); setNotFound(false) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSearch} disabled={searching || !query.trim() || !grams}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {searching ? <><RefreshCw size={15} className="animate-spin" />Buscando...</> : <><Search size={15} />Buscar</>}
          </button>

          {/* Candidates */}
          {candidates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Selecciona el alimento:</p>
              {candidates.map(c => (
                <button key={c.id} onClick={() => selectCandidate(c)}
                  className="w-full flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    {c.brand && <p className="text-xs text-gray-400 mt-0.5">{c.brand}</p>}
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Not found */}
          {notFound && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                No encontrado. Prueba con un nombre más genérico (ej: &quot;yogur&quot; en vez de &quot;yogur desnatado con frutas&quot;) o en inglés.
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{grams}{unit} · vía {result.source}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Kcal', value: String(result.kcal), color: 'text-amber-600 dark:text-amber-400' },
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
              <p className="text-[11px] text-gray-400">Por 100{unit}: {result.per100g.kcal} kcal · {result.per100g.prot}g prot</p>
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
                  <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total</span>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-amber-600">{total.kcal} kcal</span>
                  <span className="text-xs font-semibold text-emerald-600">{total.prot}g prot</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave(items, total.kcal, total.prot, '')} disabled={items.length === 0}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {items.length > 0 ? `Guardar (${total.kcal} kcal)` : 'Añade alimentos'}
          </button>
        </div>
      </div>
    </div>
  )
}
