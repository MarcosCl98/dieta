import { Option, Meal, DayData } from './data'

// Base kcal the diet was designed for (Marcos, fuerza tarde)
export const BASE_KCAL = 2480

// Round to nearest 5
function r5(n: number): number {
  return Math.round(n / 5) * 5
}

// Scale a quantity string: "150g" → "190g", "200ml" → "250ml"
// Numbers without units (counts like "2 huevos", "1 plátano") are NOT scaled
function scaleText(text: string, factor: number): string {
  // Match patterns like "150g", "200ml", "120ml", "80g"
  // But NOT standalone numbers without unit (e.g. "2 huevos", "1 plátano", "4 claras")
  return text.replace(/(\d+)(g|ml)/g, (_, num, unit) => {
    const original = parseInt(num, 10)
    // Don't scale very small amounts (≤5) — things like "5g miel", these are seasoning/rounding artifacts
    // Actually do scale them but with floor at their original if result is 0
    const scaled = r5(original * factor)
    const result = Math.max(scaled, unit === 'ml' ? 5 : 5)
    return `${result}${unit}`
  })
}

export function scaleOption(opt: Option, factor: number): Option {
  if (Math.abs(factor - 1) < 0.02) return opt // no change if within 2%
  return {
    ...opt,
    name: scaleText(opt.name, factor),
    recipe: opt.recipe ? scaleText(opt.recipe, factor) : opt.recipe,
    comp: opt.comp ? scaleText(opt.comp, factor) : opt.comp,
    kcal: Math.round(opt.kcal * factor),
    prot: Math.round(opt.prot * factor),
    carbs: Math.round(opt.carbs * factor),
    grasa: Math.round(opt.grasa * factor),
  }
}

export function scaleMeal(meal: Meal, factor: number): Meal {
  if (Math.abs(factor - 1) < 0.02) return meal
  return {
    ...meal,
    kcal: Math.round(meal.kcal * factor),
    prot: Math.round(meal.prot * factor),
    options: meal.options.map(o => scaleOption(o, factor)),
  }
}

export function scaleDayData(dayData: DayData, targetKcal: number): DayData {
  const factor = targetKcal / BASE_KCAL
  if (Math.abs(factor - 1) < 0.02) return dayData
  return {
    ...dayData,
    macros: {
      kcal: Math.round(dayData.macros.kcal * factor),
      prot: Math.round(dayData.macros.prot * factor),
      carbs: Math.round(dayData.macros.carbs * factor),
      grasa: Math.round(dayData.macros.grasa * factor),
    },
    meals: dayData.meals.map(m => scaleMeal(m, factor)),
  }
}
