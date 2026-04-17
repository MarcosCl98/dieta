import { NextRequest, NextResponse } from 'next/server'

const CLIENT_ID = process.env.FATSECRET_CLIENT_ID!
const CLIENT_SECRET = process.env.FATSECRET_CLIENT_SECRET!

async function getToken() {
  const res = await fetch('https://oauth.fatsecret.com/connect/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials&scope=basic',
  })
  const data = await res.json()
  return data.access_token
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') ?? 'coca cola'
  const token = await getToken()

  const searchRes = await fetch(
    `https://platform.fatsecret.com/rest/server.api?method=foods.search&search_expression=${encodeURIComponent(q)}&format=json&max_results=3`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const searchData = await searchRes.json()
  const foods = searchData?.foods?.food
  const first = Array.isArray(foods) ? foods[0] : foods
  if (!first) return NextResponse.json({ error: 'no foods', searchData })

  const detailRes = await fetch(
    `https://platform.fatsecret.com/rest/server.api?method=food.get.v4&food_id=${first.food_id}&format=json`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const detailData = await detailRes.json()
  return NextResponse.json({ food_name: first.food_name, food_id: first.food_id, detail: detailData?.food?.servings })
}
