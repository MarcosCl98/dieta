import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

// Clear all meal selections for a user+date (called when switching day type)
export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })

  const { userId, date } = await req.json()
  if (!userId || !date) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { error } = await supabase
    .from('meal_selections')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
