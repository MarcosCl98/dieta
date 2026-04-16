export type GoalType = 'loss' | 'gain' | 'maintain'
export type SexType = 'male' | 'female'
export type ActivityType = 'low' | 'medium' | 'high'

export interface UserPlanInput {
  age: number
  sex: SexType
  heightCm: number
  weightKg: number
  trainingDays: number
  activity: ActivityType
  goal: GoalType
}

export interface UserPlan extends UserPlanInput {
  bmr: number
  tdee: number
  targetKcal: number
  protein: number
  carbs: number
  fat: number
}

export interface UserProfile {
  id: string
  name: string
  avatar: string
  pin: string
  plan: UserPlan | null
}

export const AVATAR_OPTIONS = ['🦁', '🐼', '🦊', '🐯', '🐻', '🐵', '🐨', '🐶']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function round(value: number) {
  return Math.round(value)
}

export function computeNutritionPlan(input: UserPlanInput): UserPlan {
  const age = clamp(input.age, 14, 90)
  const weightKg = clamp(input.weightKg, 35, 250)
  const heightCm = clamp(input.heightCm, 130, 230)
  const trainingDays = clamp(input.trainingDays, 0, 7)

  const bmr =
    input.sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  const baseActivityFactor: Record<ActivityType, number> = {
    low: 1.25,
    medium: 1.4,
    high: 1.55,
  }
  const activityFactor = baseActivityFactor[input.activity] + trainingDays * 0.03
  const tdee = bmr * activityFactor

  const goalFactor: Record<GoalType, number> = {
    loss: 0.85,
    gain: 1.1,
    maintain: 1,
  }
  const targetKcal = tdee * goalFactor[input.goal]

  const proteinPerKg: Record<GoalType, number> = {
    loss: 2.1,
    gain: 2.2,
    maintain: 1.9,
  }
  const fatPerKg: Record<GoalType, number> = {
    loss: 0.8,
    gain: 1,
    maintain: 0.9,
  }

  const protein = weightKg * proteinPerKg[input.goal]
  const fat = weightKg * fatPerKg[input.goal]
  const carbs = Math.max(60, (targetKcal - protein * 4 - fat * 9) / 4)

  return {
    ...input,
    age,
    weightKg,
    heightCm,
    trainingDays,
    bmr: round(bmr),
    tdee: round(tdee),
    targetKcal: round(targetKcal),
    protein: round(protein),
    carbs: round(carbs),
    fat: round(fat),
  }
}

