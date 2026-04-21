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
    const nextMonth = (() => {
      const [y, m] = month.split('-').map(Number)
      const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`
      return `${next}-01`
    })()

    // Get logs and selections count for the month in parallel
    const [logRes, selRes] = await Promise.all([
      supabase
        .from('daily_log')
        .select('date, completed, cheat_note, day_type, schedule')
        .eq('user_id', userId)
        .gte('date', `${month}-01`)
        .lt('date', nextMonth),
      supabase
        .from('meal_selections')
        .select('date, meal_id')
        .eq('user_id', userId)
        .gte('date', `${month}-01`)
        .lt('date', nextMonth),
    ])

    if (logRes.error) return NextResponse.json({ error: logRes.error.message }, { status: 500 })

    // Count selections per date
    const selCountByDate: Record<string, number> = {}
    for (const s of selRes.data ?? []) {
      selCountByDate[s.date] = (selCountByDate[s.date] ?? 0) + 1
    }

    // Expected meals per day type
    const EXPECTED: Record<string, number> = {
      'fuerza-tarde': 4, 'fuerza-manana': 4, 'cardio-main': 4, 'descanso-main': 4,
    }

    const completedDates: string[] = []
    const cheatDates: string[] = []

    for (const row of logRes.data ?? []) {
      const key = `${row.day_type}-${row.schedule}`
      const expected = EXPECTED[key] ?? 4
      const actual = selCountByDate[row.date] ?? 0
      // A day is truly completed only if all expected meals are selected
      if (actual >= expected) completedDates.push(row.date)
      if (row.cheat_note) cheatDates.push(row.date)
    }

    // loggedDates = any day that has a log entry (regardless of completion)
    const loggedDates = (logRes.data ?? []).map((row: { date: string }) => row.date)
    return NextResponse.json({ completedDates, cheatDates, loggedDates })
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
