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
  const date = searchParams.get('date')
  const month = searchParams.get('month')

  if (!userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  if (month) {
    const { data, error } = await supabase
      .from('daily_log')
      .select('date, completed, cheat_note')
      .eq('user_id', userId)
      .gte('date', `${month}-01`)
      .lt('date', `${month}-32`)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      completedDates: (data ?? []).filter(r => r.completed).map(r => r.date),
      cheatDates: (data ?? []).filter(r => Boolean(r.cheat_note)).map(r => r.date),
    })
  }

  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const [logRes, selectionsRes] = await Promise.all([
    supabase.from('daily_log').select('*').eq('user_id', userId).eq('date', date).single(),
    supabase.from('meal_selections').select('*').eq('user_id', userId).eq('date', date),
  ])

  return NextResponse.json({
    log: logRes.data,
    selections: selectionsRes.data ?? [],
  })
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Missing env vars' }, { status: 500 })

  try {
    const body = await req.json()
    const { userId, date, dayType, schedule, completed, cheatNote } = body

    if (!userId || !date || !dayType || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedCheatNote =
      typeof cheatNote === 'string' && cheatNote.trim().length > 0 ? cheatNote.trim() : null

    const { error } = await supabase.from('daily_log').upsert(
      { user_id: userId, date, day_type: dayType, schedule, completed: Boolean(completed), cheat_note: normalizedCheatNote },
      { onConflict: 'user_id,date' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
