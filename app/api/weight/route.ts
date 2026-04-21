import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  const { data, error } = await supabase
    .from('weight_log')
    .select('date, weight_kg')
    .eq('user_id', userId)
    .order('date', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entries: data ?? [] })
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })
  const { userId, date, weightKg } = await req.json()
  if (!userId || !date || !weightKg) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const { error } = await supabase
    .from('weight_log')
    .upsert({ user_id: userId, date, weight_kg: weightKg }, { onConflict: 'user_id,date' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
