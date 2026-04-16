import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

function formatUnexpectedError(error: unknown) {
  if (!(error instanceof Error)) return { error: 'Unexpected server error' }
  const cause = error.cause as { code?: string; message?: string } | undefined
  return {
    error: error.message,
    cause: cause?.message ?? null,
    causeCode: cause?.code ?? null,
    supabaseUrlHost: (() => {
      const raw = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!raw) return null
      try {
        return new URL(raw).host
      } catch {
        return 'INVALID_URL'
      }
    })(),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, date, mealId, optionId, kcal, prot, carbs, grasa } = body

    if (!userId || !date || !mealId || !optionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

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

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(formatUnexpectedError(error), { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, date, mealId } = body

    if (!userId || !date || !mealId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('meal_selections')
      .delete()
      .eq('user_id', userId)
      .eq('date', date)
      .eq('meal_id', mealId)

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(formatUnexpectedError(error), { status: 500 })
  }
}
