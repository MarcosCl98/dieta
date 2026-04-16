# Dieta App

Tracker de dieta personal. Next.js 14 + Supabase + Vercel.

## Setup en 5 pasos

### 1. Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto gratis
2. En el SQL Editor, ejecuta el contenido de `supabase-schema.sql`
3. En **Project Settings → API** copia:
   - `Project URL`
   - `anon / public` key

### 2. Variables de entorno

Crea un archivo `.env.local` en la raíz:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 3. Instalar y arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Deploy en Vercel

```bash
# Si no tienes la CLI:
npm i -g vercel

vercel
```

O simplemente conecta el repo en [vercel.com](https://vercel.com) y añade las dos variables de entorno en **Settings → Environment Variables**.

### 5. Ya está

La app guarda automáticamente cada selección en Supabase.  
Cada día empieza limpio — el historial de días anteriores queda guardado en la base de datos por si algún día quieres consultarlo.

## Estructura del proyecto

```
dieta-app/
├── app/
│   ├── api/
│   │   └── selections/
│   │       ├── log/route.ts      ← guarda tipo de día
│   │       └── meal/route.ts     ← guarda selección por toma
│   ├── page.tsx                  ← página principal
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── MacroBar.tsx              ← barra de kcal/macros en tiempo real
│   ├── MealCard.tsx              ← tarjeta de cada toma con opciones
│   ├── DaySelector.tsx           ← selector fuerza/cardio/descanso + horario
│   └── Timeline.tsx              ← línea de tiempo del día
├── lib/
│   ├── data.ts                   ← todos los datos de la dieta
│   ├── supabase.ts               ← cliente de Supabase
│   └── useUserId.ts              ← UUID de usuario en localStorage
└── supabase-schema.sql           ← schema de la base de datos
```
