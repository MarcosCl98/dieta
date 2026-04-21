export type GoalType = 'loss_slow' | 'loss_fast' | 'maintain_gain' | 'gain'
export type SexType = 'male' | 'female'
export type ActivityType = 'low' | 'medium' | 'high'
export type IntensityType = 'light' | 'moderate' | 'hard'
export type StepsType = 'low' | 'medium' | 'high'  // <6k / 6-10k / >10k

export interface UserPlanInput {
  age: number
  sex: SexType
  heightCm: number
  weightKg: number
  trainingDays: number
  trainingMinutes: number   // avg session duration
  intensity: IntensityType  // training intensity
  steps: StepsType          // daily steps outside training
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

export const AVATAR_OPTIONS = [
  'bear', 'lion', 'fox', 'panda', 'wolf', 'rabbit', 'cat', 'tiger',
] as const

export type AvatarId = typeof AVATAR_OPTIONS[number]

export const AVATAR_SVGS: Record<string, string> = {
  bear: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#D4956A"/><circle cx="22" cy="18" r="11" fill="#D4956A"/><circle cx="58" cy="18" r="11" fill="#D4956A"/><circle cx="22" cy="18" r="7" fill="#C4825A"/><circle cx="58" cy="18" r="7" fill="#C4825A"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#E8AA82"/><ellipse cx="40" cy="52" rx="12" ry="9" fill="#C4825A"/><circle cx="32" cy="36" r="4" fill="#2C1A0E"/><circle cx="48" cy="36" r="4" fill="#2C1A0E"/><circle cx="33" cy="35" r="1.5" fill="white"/><circle cx="49" cy="35" r="1.5" fill="white"/><ellipse cx="40" cy="50" rx="7" ry="5" fill="#A86848"/><path d="M36 54 Q40 58 44 54" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  lion: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#E8A030"/><circle cx="40" cy="42" r="22" fill="#F0C060"/><circle cx="20" cy="30" r="12" fill="#C87820"/><circle cx="60" cy="30" r="12" fill="#C87820"/><circle cx="14" cy="22" r="8" fill="#A06010"/><circle cx="66" cy="22" r="8" fill="#A06010"/><ellipse cx="40" cy="52" rx="11" ry="8" fill="#F0D080"/><circle cx="32" cy="38" r="4" fill="#2C1A0E"/><circle cx="48" cy="38" r="4" fill="#2C1A0E"/><circle cx="33" cy="37" r="1.5" fill="white"/><circle cx="49" cy="37" r="1.5" fill="white"/><ellipse cx="40" cy="51" rx="6" ry="4.5" fill="#D4956A"/><path d="M36 55 Q40 59 44 55" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  fox: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#E8642A"/><polygon points="20,30 8,8 28,22" fill="#E8642A"/><polygon points="60,30 72,8 52,22" fill="#E8642A"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#F08050"/><ellipse cx="40" cy="52" rx="14" ry="10" fill="#F5E0D0"/><circle cx="32" cy="36" r="4" fill="#2C1A0E"/><circle cx="48" cy="36" r="4" fill="#2C1A0E"/><circle cx="33" cy="35" r="1.5" fill="white"/><circle cx="49" cy="35" r="1.5" fill="white"/><ellipse cx="40" cy="51" rx="6" ry="4" fill="#D4604A"/><path d="M36 55 Q40 59 44 55" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  panda: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#F5F5F5"/><circle cx="22" cy="20" r="12" fill="#333"/><circle cx="58" cy="20" r="12" fill="#333"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#F5F5F5"/><ellipse cx="32" cy="37" rx="7" ry="8" fill="#333"/><ellipse cx="48" cy="37" rx="7" ry="8" fill="#333"/><circle cx="32" cy="37" r="4" fill="#2C1A0E"/><circle cx="48" cy="37" r="4" fill="#2C1A0E"/><circle cx="33" cy="36" r="1.5" fill="white"/><circle cx="49" cy="36" r="1.5" fill="white"/><ellipse cx="40" cy="52" rx="10" ry="7" fill="#EEE"/><ellipse cx="40" cy="51" rx="6" ry="4" fill="#DDD"/><path d="M36 55 Q40 59 44 55" stroke="#333" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  wolf: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#7A8FA6"/><polygon points="22,28 14,6 32,20" fill="#7A8FA6"/><polygon points="58,28 66,6 48,20" fill="#7A8FA6"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#9EB0C4"/><ellipse cx="40" cy="53" rx="13" ry="9" fill="#E8E0D8"/><circle cx="32" cy="37" r="4" fill="#2C1A0E"/><circle cx="48" cy="37" r="4" fill="#2C1A0E"/><circle cx="33" cy="36" r="1.5" fill="white"/><circle cx="49" cy="36" r="1.5" fill="white"/><ellipse cx="40" cy="51" rx="6" ry="4.5" fill="#B0A8A0"/><path d="M36 56 Q40 60 44 56" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  rabbit: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#F0E8E0"/><ellipse cx="26" cy="16" rx="8" ry="16" fill="#F0E8E0"/><ellipse cx="54" cy="16" rx="8" ry="16" fill="#F0E8E0"/><ellipse cx="26" cy="16" rx="5" ry="12" fill="#F4B0C0"/><ellipse cx="54" cy="16" rx="5" ry="12" fill="#F4B0C0"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#F0E8E0"/><circle cx="32" cy="38" r="4" fill="#8090C0"/><circle cx="48" cy="38" r="4" fill="#8090C0"/><circle cx="33" cy="37" r="1.5" fill="white"/><circle cx="49" cy="37" r="1.5" fill="white"/><circle cx="40" cy="50" r="5" fill="#F4B0C0"/><path d="M36 55 Q40 59 44 55" stroke="#C080A0" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  cat: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#C8A878"/><polygon points="20,32 12,10 30,24" fill="#C8A878"/><polygon points="60,32 68,10 50,24" fill="#C8A878"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#D8B888"/><ellipse cx="40" cy="53" rx="12" ry="8" fill="#EED8B0"/><ellipse cx="32" cy="37" rx="4" ry="5" fill="#2C1A0E"/><ellipse cx="48" cy="37" rx="4" ry="5" fill="#2C1A0E"/><circle cx="33" cy="35" r="1.5" fill="white"/><circle cx="49" cy="35" r="1.5" fill="white"/><ellipse cx="40" cy="51" rx="5" ry="3.5" fill="#C4906A"/><path d="M36 55 Q40 59 44 55" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
  tiger: `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"><circle cx="40" cy="40" r="38" fill="#E07820"/><circle cx="22" cy="20" r="11" fill="#E07820"/><circle cx="58" cy="20" r="11" fill="#E07820"/><ellipse cx="40" cy="44" rx="22" ry="20" fill="#F09040"/><ellipse cx="40" cy="53" rx="13" ry="9" fill="#F5DDB0"/><path d="M30 28 Q32 22 34 28" stroke="#A04010" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M46 28 Q48 22 50 28" stroke="#A04010" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="32" cy="38" r="4" fill="#2C1A0E"/><circle cx="48" cy="38" r="4" fill="#2C1A0E"/><circle cx="33" cy="37" r="1.5" fill="white"/><circle cx="49" cy="37" r="1.5" fill="white"/><ellipse cx="40" cy="51" rx="6" ry="4.5" fill="#D47030"/><path d="M36 56 Q40 60 44 56" stroke="#2C1A0E" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>`,
}

export const AVATAR_LABELS: Record<string, string> = {
  bear: 'Oso', lion: 'León', fox: 'Zorro', panda: 'Panda',
  wolf: 'Lobo', rabbit: 'Conejo', cat: 'Gato', tiger: 'Tigre',
}

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
  const trainingMinutes = clamp(input.trainingMinutes ?? 60, 20, 120)

  // ── BMR (Mifflin-St Jeor) ──
  const bmr =
    input.sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161

  // ── NEAT: non-exercise activity (steps) ──
  // Conservative bias: steps tend to be overestimated, so we use lower multipliers
  // and cap the benefit. <6k steps = sedentary, 6-10k = light active, >10k = moderate
  const neatFactor: Record<StepsType, number> = {
    low: 1.20,      // <6k steps: mostly sitting
    medium: 1.30,   // 6-10k: some walking, office work
    high: 1.38,     // >10k: on feet a lot — capped conservatively vs old 'high' (1.55)
  }
  const steps = input.steps ?? 'medium'
  const baseTdee = bmr * neatFactor[steps]

  // ── Exercise thermogenesis: kcal burned per training session ──
  // Based on MET values, conservative estimates (people overestimate effort)
  // light = RPE 5-6 (machine work, moderate pace)
  // moderate = RPE 7-8 (compound lifts, solid effort)
  // hard = RPE 9-10 (near failure, HIIT, heavy compounds)
  const kcalPerMin: Record<IntensityType, number> = {
    light: 5.5,     // ~5 MET × weight adjustment, conservative
    moderate: 7.0,  // ~7 MET, solid lifting session
    hard: 8.5,      // ~9 MET, but we apply 0.9 discount for overestimation
  }
  const intensity = input.intensity ?? 'moderate'
  // Total weekly exercise kcal, discounted 10% for overestimation bias
  const weeklyExerciseKcal = trainingDays * trainingMinutes * kcalPerMin[intensity] * 0.90
  const dailyExerciseKcal = weeklyExerciseKcal / 7

  const tdee = baseTdee + dailyExerciseKcal

  // ── Target kcal by goal ──
  // All adjustments are conservative — better to underestimate and adjust
  const goalAdj: Record<GoalType, number> = {
    // PÉRDIDA GRADUAL: déficit moderado, sostenible meses.
    // ~0.3-0.5 kg/semana. Preserva músculo, no agota.
    loss_slow: -300,

    // PÉRDIDA RÁPIDA: déficit agresivo, max 4-6 semanas (preveano).
    // ~0.8-1 kg/semana. Proteína muy alta para frenar catabolismo.
    // No sostenible más de 6-8 semanas.
    loss_fast: -600,

    // MANTENIMIENTO + MÚSCULO: superávit mínimo.
    // Recomposición corporal: muy lento pero minimiza grasa ganada.
    // Ideal para personas con poca prisa o que no quieren engordar.
    maintain_gain: +100,

    // VOLUMEN: superávit real para máxima ganancia muscular.
    // ~0.25-0.35 kg/semana. Mínimo 6 meses para resultados notables.
    // Algo de grasa inevitable — se corta después.
    gain: +280,
  }
  const targetKcal = Math.max(1400, tdee + goalAdj[input.goal])

  // ── Macros ──
  const proteinPerKg: Record<GoalType, number> = {
    loss_slow: 2.2,    // Alta para preservar músculo en déficit
    loss_fast: 2.5,    // Muy alta — déficit agresivo necesita más proteína
    maintain_gain: 2.0, // Moderada-alta
    gain: 1.9,          // Suficiente, no necesitas más en superávit
  }
  const fatPerKg: Record<GoalType, number> = {
    loss_slow: 0.85,
    loss_fast: 0.75,   // Bajo pero suficiente para hormonas
    maintain_gain: 0.9,
    gain: 1.0,
  }

  const protein = weightKg * proteinPerKg[input.goal]
  const fat = weightKg * fatPerKg[input.goal]
  const carbs = Math.max(50, (targetKcal - protein * 4 - fat * 9) / 4)

  return {
    ...input, age, weightKg, heightCm, trainingDays, trainingMinutes,
    bmr: round(bmr), tdee: round(tdee), targetKcal: round(targetKcal),
    protein: round(protein), carbs: round(carbs), fat: round(fat),
  }
}
