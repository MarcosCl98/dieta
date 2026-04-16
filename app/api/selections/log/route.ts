import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
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
      completedDates: (data ?? []).filter((row) => row.completed).map((row) => row.date),
      cheatDates: (data ?? []).filter((row) => Boolean(row.cheat_note)).map((row) => row.date),
    })
  }

  if (!date) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

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
  try {
    const body = await req.json()
    const { userId, date, dayType, schedule, completed, cheatNote } = body

    if (!userId || !date || !dayType || !schedule) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedCheatNote =
      typeof cheatNote === 'string' && cheatNote.trim().length > 0 ? cheatNote.trim() : null

    const { error } = await supabase.from('daily_log').upsert(
      {
        user_id: userId,
        date,
        day_type: dayType,
        schedule,
        completed: Boolean(completed),
        cheat_note: normalizedCheatNote,
      },
      { onConflict: 'user_id,date' }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
