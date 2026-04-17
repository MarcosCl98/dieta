import { NextRequest, NextResponse } from 'next/server'

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID!
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET!

async function getToken(): Promise<string | null> {
  try {
    const res = await fetch('https://oauth.fatsecret.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials&scope=basic',
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token ?? null
  } catch { return null }
}

function pickBestServing(servings: Record<string, string>[]) {
  if (!servings?.length) return null
  const withMetric = servings.filter(s =>
    s.metric_serving_amount && parseFloat(s.metric_serving_amount) > 0 &&
    (s.metric_serving_unit === 'g' || s.metric_serving_unit === 'ml')
  )
  if (withMetric.length > 0) {
    return withMetric.reduce((best, s) => {
      const diff = Math.abs(parseFloat(s.metric_serving_amount) - 100)
      const bestDiff = Math.abs(parseFloat(best.metric_serving_amount) - 100)
      return diff < bestDiff ? s : best
    })
  }
  return servings.find(s => parseFloat(s.calories ?? '0') > 0) ?? servings[0]
}

function calcNutrition(serving: Record<string, string>, grams: number) {
  const servingGrams = parseFloat(serving.metric_serving_amount ?? '100')
  const factor = grams / servingGrams
  const per100Factor = 100 / servingGrams
  return {
    kcal: Math.round(parseFloat(serving.calories ?? '0') * factor),
    prot: Math.round(parseFloat(serving.protein ?? '0') * factor * 10) / 10,
    carbs: Math.round(parseFloat(serving.carbohydrate ?? '0') * factor * 10) / 10,
    grasa: Math.round(parseFloat(serving.fat ?? '0') * factor * 10) / 10,
    per100g: {
      kcal: Math.round(parseFloat(serving.calories ?? '0') * per100Factor),
      prot: Math.round(parseFloat(serving.protein ?? '0') * per100Factor * 10) / 10,
      carbs: Math.round(parseFloat(serving.carbohydrate ?? '0') * per100Factor * 10) / 10,
      grasa: Math.round(parseFloat(serving.fat ?? '0') * per100Factor * 10) / 10,
    }
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const grams = parseFloat(searchParams.get('g') ?? '100')
  // If food_id provided, get detail for that specific food
  const foodId = searchParams.get('food_id')

  if (!query && !foodId) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  if (!grams || grams <= 0) return NextResponse.json({ error: 'Invalid grams' }, { status: 400 })

  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 502 })

  try {
    // If food_id given, get detail directly
    if (foodId) {
      const detailRes = await fetch(
        `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${foodId}&format=json`,
        { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
      )
      if (!detailRes.ok) return NextResponse.json({ error: 'Detail failed' }, { status: 502 })
      const detailData = await detailRes.json()
      const food = detailData?.food
      const servingsRaw = food?.servings?.serving
      if (!servingsRaw) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const servings = Array.isArray(servingsRaw) ? servingsRaw : [servingsRaw]
      const serving = pickBestServing(servings)
      if (!serving) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      const nutrition = calcNutrition(serving, grams)
      return NextResponse.json({ name: food.food_name, source: 'FatSecret', ...nutrition })
    }

    // Search and return list of candidates
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query!)}&format=json&max_results=8`,
      { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) }
    )
    if (!searchRes.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 })
    const searchData = await searchRes.json()

    const foodsRaw = searchData?.foods?.food
    if (!foodsRaw) return NextResponse.json({ error: 'not_found' }, { status: 404 })
    const foods = Array.isArray(foodsRaw) ? foodsRaw : [foodsRaw]

    // Return list for user to pick from
    const candidates = foods.map((f: Record<string, string>) => ({
      food_id: f.food_id,
      name: f.food_name,
      brand: f.brand_name ?? null,
      description: f.food_description ?? null,
    }))

    return NextResponse.json({ candidates })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 502 })
  }
}
