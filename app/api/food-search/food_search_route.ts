import { NextRequest, NextResponse } from 'next/server'

export interface FoodResult {
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  source: string
  per100g: { kcal: number; prot: number; carbs: number; grasa: number }
}

// Basic Spanish → English dictionary for common foods
const ES_EN: Record<string, string> = {
  'pechuga': 'chicken breast',
  'pechuga de pollo': 'chicken breast',
  'pollo': 'chicken',
  'pollo asado': 'roasted chicken',
  'ternera': 'beef',
  'carne picada': 'ground beef',
  'solomillo': 'beef tenderloin',
  'cerdo': 'pork',
  'jamon serrano': 'serrano ham',
  'jamon': 'ham',
  'salmon': 'salmon',
  'merluza': 'hake',
  'atun': 'tuna',
  'bacalao': 'cod',
  'huevo': 'egg',
  'huevos': 'eggs',
  'clara': 'egg white',
  'claras': 'egg whites',
  'leche': 'whole milk',
  'leche desnatada': 'skim milk',
  'yogur': 'yogurt',
  'queso': 'cheese',
  'mozzarella': 'mozzarella cheese',
  'requesón': 'ricotta',
  'cottage': 'cottage cheese',
  'avena': 'oats',
  'arroz': 'white rice',
  'pasta': 'pasta',
  'pan': 'bread',
  'pan integral': 'whole wheat bread',
  'gnocchi': 'gnocchi',
  'patata': 'potato',
  'boniato': 'sweet potato',
  'brocoli': 'broccoli',
  'espinacas': 'spinach',
  'platano': 'banana',
  'manzana': 'apple',
  'naranja': 'orange',
  'arandanos': 'blueberries',
  'aguacate': 'avocado',
  'aceite de oliva': 'olive oil',
  'aceite': 'olive oil',
  'mantequilla': 'butter',
  'lentejas': 'lentils',
  'garbanzos': 'chickpeas',
  'judias': 'kidney beans',
  'almendras': 'almonds',
  'nueces': 'walnuts',
  'pizza': 'pizza',
  'hamburguesa': 'hamburger',
  'tortilla': 'spanish omelette',
  'whey': 'whey protein',
  'proteina': 'protein powder',
  'chocolate': 'chocolate',
  'helado': 'ice cream',
  'cerveza': 'beer',
  'vino': 'wine',
  'coca cola': 'coca cola',
  'champinones': 'mushrooms',
  'esparragos': 'asparagus',
  'pimiento': 'bell pepper',
  'tomate': 'tomato',
  'lechuga': 'lettuce',
  'pepino': 'cucumber',
  'zanahoria': 'carrot',
  'cebolla': 'onion',
}

function toEnglish(query: string): string {
  const q = query.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove accents
  return ES_EN[q] ?? query
}

async function searchOpenFoodFacts(query: string): Promise<FoodResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments&sort_by=unique_scans_n`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const products = (data.products ?? []) as Array<{ product_name?: string; nutriments?: Record<string, number> }>

    for (const p of products) {
      const n = p.nutriments ?? {}
      const kcalVal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : null)
      const prot = n['proteins_100g']
      const carbs = n['carbohydrates_100g']
      const fat = n['fat_100g']

      if (kcalVal && prot !== undefined && carbs !== undefined && fat !== undefined && kcalVal > 0) {
        return {
          name: p.product_name ?? query,
          kcal: 0, prot: 0, carbs: 0, grasa: 0,
          source: 'Open Food Facts',
          per100g: {
            kcal: Math.round(kcalVal),
            prot: Math.round(prot * 10) / 10,
            carbs: Math.round(carbs * 10) / 10,
            grasa: Math.round(fat * 10) / 10,
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

async function searchUSDA(query: string): Promise<FoodResult | null> {
  try {
    const apiKey = process.env.USDA_API_KEY ?? 'DEMO_KEY'
    // Search in Foundation and SR Legacy (raw ingredients, most accurate)
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${apiKey}&dataType=Foundation,SR%20Legacy`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) return null
    const data = await res.json()
    const foods = (data.foods ?? []) as Array<{ description?: string; foodNutrients?: Array<{ nutrientName: string; value: number }> }>

    for (const f of foods) {
      const nutrients = f.foodNutrients ?? []
      const get = (name: string) => nutrients.find(n => n.nutrientName === name)?.value ?? null

      const kcal = get('Energy')
      const prot = get('Protein')
      const carbs = get('Carbohydrate, by difference')
      const fat = get('Total lipid (fat)')

      if (kcal && prot !== null && carbs !== null && fat !== null) {
        return {
          name: f.description ?? query,
          kcal: 0, prot: 0, carbs: 0, grasa: 0,
          source: 'USDA',
          per100g: {
            kcal: Math.round(kcal),
            prot: Math.round((prot ?? 0) * 10) / 10,
            carbs: Math.round((carbs ?? 0) * 10) / 10,
            grasa: Math.round((fat ?? 0) * 10) / 10,
          }
        }
      }
    }
    return null
  } catch {
    return null
  }
}

function applyGrams(result: FoodResult, grams: number): FoodResult {
  const f = grams / 100
  return {
    ...result,
    kcal: Math.round(result.per100g.kcal * f),
    prot: Math.round(result.per100g.prot * f * 10) / 10,
    carbs: Math.round(result.per100g.carbs * f * 10) / 10,
    grasa: Math.round(result.per100g.grasa * f * 10) / 10,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const grams = parseInt(searchParams.get('g') ?? '100', 10)

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  if (isNaN(grams) || grams <= 0) return NextResponse.json({ error: 'Invalid grams' }, { status: 400 })

  const englishQuery = toEnglish(query)

  // 1. Try Open Food Facts with original query
  let result = await searchOpenFoodFacts(query)

  // 2. Try USDA with translated query (better for raw ingredients)
  if (!result) result = await searchUSDA(englishQuery)

  // 3. Try Open Food Facts with English query as fallback
  if (!result && englishQuery !== query) result = await searchOpenFoodFacts(englishQuery)

  if (!result) {
    return NextResponse.json({ 
      error: 'not_found',
      hint: `Prueba en inglés: "${englishQuery}"` 
    }, { status: 404 })
  }

  return NextResponse.json(applyGrams(result, grams))
}
