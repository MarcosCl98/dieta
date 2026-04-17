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

async function searchOpenFoodFacts(query: string): Promise<FoodResult | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=5&fields=product_name,nutriments,countries_tags&sort_by=unique_scans_n`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const products = data.products ?? []

    // Prefer Spanish/European products and those with complete nutriment data
    for (const p of products) {
      const n = p.nutriments ?? {}
      const kcal = n['energy-kcal_100g'] ?? n['energy_100g'] ? (n['energy_100g'] / 4.184) : null
      const prot = n['proteins_100g']
      const carbs = n['carbohydrates_100g']
      const fat = n['fat_100g']

      const kcalVal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : null)

      if (kcalVal && prot !== undefined && carbs !== undefined && fat !== undefined) {
        return {
          name: p.product_name ?? query,
          kcal: 0, prot: 0, carbs: 0, grasa: 0, // filled in by caller
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
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=5&api_key=${apiKey}&dataType=Foundation,SR%20Legacy`
    const res = await fetch(url, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    const foods = data.foods ?? []

    for (const f of foods) {
      const nutrients = f.foodNutrients ?? []
      const get = (name: string) => nutrients.find((n: { nutrientName: string }) => n.nutrientName === name)?.value ?? null

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

function applyGrams(result: FoodResult, grams: number): FoodResult {
  const factor = grams / 100
  return {
    ...result,
    kcal: Math.round(result.per100g.kcal * factor),
    prot: Math.round(result.per100g.prot * factor * 10) / 10,
    carbs: Math.round(result.per100g.carbs * factor * 10) / 10,
    grasa: Math.round(result.per100g.grasa * factor * 10) / 10,
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const grams = parseInt(searchParams.get('g') ?? '100', 10)

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  if (isNaN(grams) || grams <= 0) return NextResponse.json({ error: 'Invalid grams' }, { status: 400 })

  // Try Open Food Facts first, then USDA
  let result = await searchOpenFoodFacts(query)
  if (!result) result = await searchUSDA(query)
  if (!result) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json(applyGrams(result, grams))
}
