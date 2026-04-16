import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { userId, date, mealId, optionId, kcal, prot, carbs, grasa } = body

  const { error } = await supabase.from('meal_selections').upsert(
    {
      user_id: userId,
      date,
      meal_id: mealId,
      option_id: optionId,
      kcal,
      prot,
      carbs,
      grasa,
    },
    { onConflict: 'user_id,date,meal_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const { userId, date, mealId } = body

  const { error } = await supabase
    .from('meal_selections')
    .delete()
    .eq('user_id', userId)
    .eq('date', date)
    .eq('meal_id', mealId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
