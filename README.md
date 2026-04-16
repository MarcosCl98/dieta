

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
