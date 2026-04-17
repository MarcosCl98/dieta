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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  const grams = parseFloat(searchParams.get('g') ?? '100')

  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 })
  if (!grams || grams <= 0) return NextResponse.json({ error: 'Invalid grams' }, { status: 400 })

  const token = await getToken()
  if (!token) return NextResponse.json({ error: 'Auth failed' }, { status: 502 })

  try {
    // Search foods
    const searchRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(query)}&format=json&max_results=5`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!searchRes.ok) return NextResponse.json({ error: 'Search failed' }, { status: 502 })
    const searchData = await searchRes.json()

    const foods = searchData?.foods?.food
    if (!foods) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    // Pick first result
    const food = Array.isArray(foods) ? foods[0] : foods
    const foodId = food.food_id

    // Get detailed nutrition
    const detailRes = await fetch(
      `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${foodId}&format=json`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!detailRes.ok) return NextResponse.json({ error: 'Detail failed' }, { status: 502 })
    const detailData = await detailRes.json()

    const servings = detailData?.food?.servings?.serving
    const serving100g = Array.isArray(servings)
      ? servings.find((s: { serving_description: string }) =>
          s.serving_description?.includes('100') ||
          s.serving_description?.toLowerCase().includes('g')
        ) ?? servings[0]
      : servings

    if (!serving100g) return NextResponse.json({ error: 'not_found' }, { status: 404 })

    const servingGrams = parseFloat(serving100g.metric_serving_amount ?? '100')
    const factor = grams / servingGrams

    const kcal = parseFloat(serving100g.calories ?? '0') * factor
    const prot = parseFloat(serving100g.protein ?? '0') * factor
    const carbs = parseFloat(serving100g.carbohydrate ?? '0') * factor
    const fat = parseFloat(serving100g.fat ?? '0') * factor

    const per100gFactor = 100 / servingGrams
    return NextResponse.json({
      name: food.food_name,
      kcal: Math.round(kcal),
      prot: Math.round(prot * 10) / 10,
      carbs: Math.round(carbs * 10) / 10,
      grasa: Math.round(fat * 10) / 10,
      source: 'FatSecret',
      per100g: {
        kcal: Math.round(parseFloat(serving100g.calories ?? '0') * per100gFactor),
        prot: Math.round(parseFloat(serving100g.protein ?? '0') * per100gFactor * 10) / 10,
        carbs: Math.round(parseFloat(serving100g.carbohydrate ?? '0') * per100gFactor * 10) / 10,
        grasa: Math.round(parseFloat(serving100g.fat ?? '0') * per100gFactor * 10) / 10,
      }
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 502 })
  }
}
