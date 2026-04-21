export type DayType = 'fuerza' | 'cardio' | 'descanso'
export type ScheduleType = 'tarde' | 'manana' | 'main'

export interface Option {
  id: string
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  type: 'normal' | 'rapida' | 'yogur' | 'airfryer' | 'ocasional'
  recipe?: string
  comp?: string
}

export interface Meal {
  id: string
  title: string
  time: string
  kcal: number
  prot: number
  tag?: string
  noteType?: 'g' | 'a' | 'i' | ''
  note: string
  options: Option[]
}

export interface DayData {
  macros: { kcal: number; prot: number; carbs: number; grasa: number }
  timeline: { time: string; label: string; type: 'i' | 'ac' | 'wn' }[]
  meals: Meal[]
  dayNote?: string
}

const R = {
  afc: 'Air fryer: pechuga entera, 180°C, 15-16 min dando la vuelta a mitad. Sazona con ajo en polvo, pimentón y sal.',
  afs: 'Air fryer: filete de salmón, 180°C, 10-12 min sin dar vuelta. Unas gotas de limón.',
  afp: 'Air fryer: filetes de pavo, 180°C, 12-14 min. Marinar 5 min con limón y orégano.',
  afm: 'Air fryer: lomo de merluza, 180°C, 10-12 min. AOVE, sal y perejil.',
  afh: 'Air fryer hamburguesa: forma una hamburguesa con 150g de carne de cerdo ibérico picada. 180°C, 14-16 min dando vuelta a mitad. 2 lonchas queso encima el último minuto. Pan brioche tostado 2 min aparte.',
  afpt: 'Air fryer patatas: corta en gajos o rodajas, spray de aceite por encima, sal y especias. 200°C, 20-22 min agitando a mitad. Quedan crujientes por fuera.',
  pizza: 'Pizza cottage (air fryer): mezcla 200g cottage + 2 huevos + 40g avena triturada. Extiende en papel de horno. 180°C, 12-14 min. Añade topping los últimos 3-4 min.',
  boca: 'Rápido: tuesta el pan si quieres. Coloca el embutido y AOVE si quieres. Listo en 2 min.',
  tort: 'Tortilla: 120ml claras del frasco (= 4 claras) + 1 huevo entero. Bate, sartén a fuego medio-bajo, tapa 1 min y dobla. Air fryer: molde apto, 160°C, 8 min.',
  gnoc: 'Gnocchi: cuece en agua con sal 2-3 min (flotan cuando están listos). Saltea 1 min en sartén con AOVE. Añade la salsa directamente.',
  batido1: 'Batido Chocolate Plátano: 30g whey chocolate + 200ml leche prot desnatada + 1 plátano + 5g cacao puro. Batir todo en shaker o batidora.',
  batido2: 'Batido Fresa Yogur: 30g whey fresa + 150ml leche prot desnatada + 100g yogur griego 0% + 80g fresas frescas o congeladas. Batir con batidora.',
  batido3: 'Batido Vainilla Avena: 30g whey vainilla + 200ml leche prot desnatada + 40g avena + 10g mantequilla cacahuete. Dejar reposar 2 min para que la avena absorba.',
  batido4: 'Batido Verde Proteico: 30g whey vainilla + 200ml leche prot desnatada + 1 plátano + 30g espinacas baby (no se nota el sabor). Batidora obligatoria.',
}

function veg(txt: string) {
  return `${txt} [opcional]`
}

// Desayuno fuerza tarde — sin batido (va al post), sin porridge
const desayunoFuerzaTarde = {
  id: 'desayuno',
  title: 'Desayuno',
  time: '8:00h',
  kcal: 520,
  prot: 36,
  noteType: '' as const,
  note: 'Sin batido aquí — lo reservamos para el post-entreno. Aguacate o embutido, no los dos.',
  options: [
    { id: 'b', name: '2 tostadas Oroweat + 120ml claras + 1 huevo revuelto + 60g pechuga de pavo loncheada', kcal: 490, prot: 40, carbs: 44, grasa: 12, type: 'rapida' as const, recipe: R.tort },
    { id: 'c', name: '2 tostadas Oroweat + 1/2 aguacate (70g) + 120ml claras + 1 huevo + arándanos (80g)', kcal: 540, prot: 32, carbs: 46, grasa: 22, type: 'normal' as const },
    { id: 'd', name: 'Bol: yogur straciatella (120g) + 200ml leche prot desnatada + 60g avena + arándanos (80g) + 10g miel', kcal: 490, prot: 30, carbs: 72, grasa: 6, type: 'yogur' as const },
    { id: 'e', name: 'Bocadillo: pan blanco (80g) + 60g jamón serrano + café con leche prot desnatada', kcal: 470, prot: 36, carbs: 50, grasa: 16, type: 'rapida' as const, recipe: R.boca },
  ],
}

// Post-entreno — siempre batido de proteína, 4 recetas
const postEntrenoFuerzaTarde = {
  id: 'post',
  title: 'Post-entreno',
  time: '17:00h (máx. 30 min)',
  kcal: 295,
  prot: 32,
  tag: 'post-entreno',
  noteType: 'a' as const,
  note: 'Ventana anabólica. Siempre batido de proteína + carbos simples. No lo saltes.',
  options: [
    { id: 'a', name: 'Batido Chocolate Plátano: 30g whey chocolate + 200ml leche prot + 1 plátano + 5g cacao', kcal: 310, prot: 32, carbs: 38, grasa: 4, type: 'normal' as const, recipe: R.batido1 },
    { id: 'b', name: 'Batido Fresa Yogur: 30g whey fresa + 150ml leche prot + 100g yogur griego 0% + 80g fresas', kcal: 280, prot: 34, carbs: 24, grasa: 3, type: 'yogur' as const, recipe: R.batido2 },
    { id: 'c', name: 'Batido Vainilla Avena: 30g whey vainilla + 200ml leche prot + 40g avena + 10g mantequilla cacahuete', kcal: 400, prot: 36, carbs: 38, grasa: 10, type: 'normal' as const, recipe: R.batido3 },
    { id: 'd', name: 'Batido Verde: 30g whey vainilla + 200ml leche prot + 1 plátano + 30g espinacas baby', kcal: 290, prot: 30, carbs: 34, grasa: 3, type: 'normal' as const, recipe: R.batido4 },
  ],
}

// Comida fuerza tarde — opciones consolidadas
const comidaFuerzaTarde = {
  id: 'comida',
  title: 'Comida — pre-entreno',
  time: '12:30h (2,5h antes)',
  kcal: 780,
  prot: 50,
  tag: 'pre-entreno',
  noteType: 'g' as const,
  note: 'Tu toma más importante. Carbos altos para cargar glucógeno. Elige el carbo que te apetezca.',
  options: [
    {
      id: 'a',
      name: '150g pollo (air fryer) + carbo a elegir: 90g arroz / 80g pasta / 200g gnocchi + salsa tomate + 10ml AOVE + yogur straciatella (120g)',
      kcal: 760, prot: 50, carbs: 78, grasa: 15,
      type: 'airfryer' as const,
      recipe: R.afc,
      comp: 'Arroz: 90g en seco → rinde ~270g cocido. Pasta: 80g en seco → rinde ~200g cocida. Gnocchi: 200g directos.',
    },
    {
      id: 'b',
      name: '150g ternera/carne picada (air fryer) + patatas air fryer (200g) + spray aceite + yogur straciatella (120g)',
      kcal: 760, prot: 50, carbs: 72, grasa: 18,
      type: 'airfryer' as const,
      recipe: R.afpt,
      comp: '+ yogur straciatella compensa los 50g menos de carne',
    },
    {
      id: 'c',
      name: 'Bocadillo: pan blanco (120g) + proteína a elegir: 120g pechuga de pavo loncheada / 80g jamón serrano + AOVE + 1 fruta',
      kcal: 725, prot: 43, carbs: 77, grasa: 15,
      type: 'rapida' as const,
      recipe: R.boca,
      comp: 'Pavo: más proteína, menos grasa. Jamón: más sabor, algo más de grasa.',
    },
  ],
}

// Cena fuerza (tarde y mañana) — tortilla de atún, sin hamburguesa ni bocadillo
const cenaFuerza = {
  id: 'cena',
  title: 'Cena',
  time: '21:00h',
  kcal: 580,
  prot: 44,
  noteType: '' as const,
  note: 'Proteína alta, carbos bajos. Sin arroz ni pasta.',
  options: [
    { id: 'a', name: `200g salmón (air fryer) + ${veg('ensalada')} + 15ml AOVE`, kcal: 510, prot: 42, carbs: 8, grasa: 32, type: 'airfryer' as const, recipe: R.afs },
    { id: 'b', name: `150g pollo (air fryer) + ${veg('brócoli al vapor')} + 2 huevos plancha + 10ml AOVE + yogur straciatella (120g)`, kcal: 520, prot: 48, carbs: 10, grasa: 22, type: 'airfryer' as const, recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
    { id: 'c', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 620, prot: 58, carbs: 38, grasa: 22, type: 'airfryer' as const, recipe: R.pizza },
    { id: 'd', name: `Tortilla (120ml claras + 2 huevos) + atún al natural (80g) + ${veg('champiñones')} + 10ml AOVE`, kcal: 500, prot: 42, carbs: 4, grasa: 28, type: 'normal' as const, recipe: R.tort },
  ],
}

export const DIET_DATA: Record<DayType, Record<string, DayData>> = {
  fuerza: {
    tarde: {
      macros: { kcal: 2480, prot: 150, carbs: 268, grasa: 74 },
      timeline: [
        { time: '8:00', label: 'Desayuno', type: 'i' },
        { time: '12:30', label: 'Comida\npre-entreno', type: 'ac' },
        { time: '15:00', label: 'ENTRENO', type: 'wn' },
        { time: '17:00', label: 'Post-\nentreno', type: 'i' },
        { time: '21:00', label: 'Cena', type: 'i' },
      ],
      meals: [
        desayunoFuerzaTarde,
        comidaFuerzaTarde,
        postEntrenoFuerzaTarde,
        cenaFuerza,
      ],
    },
    manana: {
      macros: { kcal: 2480, prot: 150, carbs: 268, grasa: 74 },
      timeline: [
        { time: '7:00', label: 'Pre-entreno\nligero', type: 'ac' },
        { time: '7:30', label: 'ENTRENO', type: 'wn' },
        { time: '9:30', label: 'Post-entreno\n(desayuno)', type: 'ac' },
        { time: '14:00', label: 'Comida', type: 'i' },
        { time: '21:00', label: 'Cena', type: 'i' },
      ],
      meals: [
        {
          id: 'pre',
          title: 'Pre-entreno — en ayunas o casi',
          time: '7:00h',
          kcal: 80,
          prot: 5,
          tag: 'pre-entreno',
          noteType: 'a',
          note: 'No tienes hambre, no te fuerces. Ayunas si el entreno dura menos de 60 min.',
          options: [
            { id: 'a', name: 'Nada — entreno en ayunas completo', kcal: 0, prot: 0, carbs: 0, grasa: 0, type: 'normal' },
            { id: 'b', name: '20g whey + agua', kcal: 85, prot: 18, carbs: 2, grasa: 1, type: 'normal' },
            { id: 'c', name: '200ml leche prot desnatada + café', kcal: 80, prot: 10, carbs: 8, grasa: 2, type: 'normal' },
            { id: 'd', name: '1 plátano pequeño + café solo', kcal: 95, prot: 1, carbs: 23, grasa: 0, type: 'normal' },
          ],
        },
        {
          id: 'post',
          title: 'Post-entreno — desayuno fuerte',
          time: '9:30h (nada más llegar)',
          kcal: 720,
          prot: 50,
          tag: 'post-entreno',
          noteType: 'g',
          note: 'El plato más importante del día. Carbos + proteína tras el esfuerzo. Aquí sí va el batido o el porridge.',
          options: [
            { id: 'a', name: 'Batido Chocolate Plátano: 40g whey chocolate + 200ml leche prot + 80g avena + 1 plátano + 5g cacao', kcal: 710, prot: 52, carbs: 80, grasa: 12, type: 'normal', recipe: R.batido1 },
            { id: 'b', name: 'Porridge: 80g avena + 200ml leche prot desnatada + 120ml claras + 1 huevo + 1 plátano + 10g miel', kcal: 730, prot: 50, carbs: 80, grasa: 14, type: 'normal', recipe: R.tort },
            { id: 'c', name: 'Batido Vainilla Avena: 40g whey vainilla + 200ml leche prot + 80g avena + 10g mantequilla cacahuete + 1 plátano', kcal: 720, prot: 54, carbs: 76, grasa: 14, type: 'normal', recipe: R.batido3 },
            { id: 'd', name: '200g Skyr natural + 80g avena + 1 plátano + 10g miel + 2 huevos cocidos', kcal: 700, prot: 50, carbs: 78, grasa: 14, type: 'yogur' },
            { id: 'e', name: '3 tostadas Oroweat + 120ml claras + 2 huevos revueltos + 60g pechuga de pavo loncheada + 1 naranja', kcal: 660, prot: 48, carbs: 62, grasa: 16, type: 'rapida', recipe: R.tort },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 770,
          prot: 50,
          noteType: '',
          note: 'Comida completa. Carbos moderados. Elige el carbo que más te apetezca.',
          options: [
            {
              id: 'a',
              name: '150g pollo (air fryer) + carbo a elegir: 80g arroz / 70g pasta / 200g gnocchi + salsa tomate + 10ml AOVE + yogur straciatella (120g)',
              kcal: 740, prot: 48, carbs: 74, grasa: 14,
              type: 'airfryer',
              recipe: R.afc,
              comp: '+ yogur straciatella compensa los 50g menos de pollo',
            },
            { id: 'b', name: `200g salmón (air fryer) + 200g boniato + ${veg('espárragos')} + 10ml AOVE`, kcal: 780, prot: 44, carbs: 64, grasa: 28, type: 'airfryer', recipe: R.afs },
            {
              id: 'c',
              name: '150g ternera/carne picada (air fryer) + patatas air fryer (200g) + spray aceite + yogur straciatella (120g)',
              kcal: 760, prot: 50, carbs: 70, grasa: 18,
              type: 'airfryer',
              recipe: R.afpt,
              comp: '+ yogur straciatella compensa los 50g menos de carne',
            },
            {
              id: 'd',
              name: 'Bocadillo: pan blanco (120g) + proteína a elegir: 120g pechuga de pavo / 80g jamón serrano + AOVE + 1 fruta',
              kcal: 725, prot: 43, carbs: 77, grasa: 15,
              type: 'rapida',
              recipe: R.boca,
              comp: 'Pavo: más proteína, menos grasa. Jamón: más sabor, algo más de grasa.',
            },
          ],
        },
        cenaFuerza,
      ],
    },
  },

  cardio: {
    main: {
      macros: { kcal: 2300, prot: 150, carbs: 240, grasa: 72 },
      dayNote: 'Día de carrera (~8km). Sales a primera hora en ayunas o con algo mínimo. El post-carrera es la toma más importante.',
      timeline: [
        { time: '7:00', label: 'Pre-carrera\nopcional', type: 'ac' },
        { time: '7:15', label: 'CARRERA\n8km', type: 'wn' },
        { time: '9:00', label: 'Post-carrera\n(desayuno)', type: 'ac' },
        { time: '14:00', label: 'Comida', type: 'i' },
        { time: '21:00', label: 'Cena', type: 'i' },
      ],
      meals: [
        {
          id: 'pre',
          title: 'Pre-carrera — opcional',
          time: '7:00h (antes de salir)',
          kcal: 60,
          prot: 1,
          tag: 'pre-carrera',
          noteType: 'a',
          note: 'Para 8km no necesitas comer antes. En ayunas funciona perfectamente. Si notas que te quedas sin energía, toma algo mínimo y digestivo.',
          options: [
            { id: 'a', name: 'Nada — carrera en ayunas (recomendado)', kcal: 0, prot: 0, carbs: 0, grasa: 0, type: 'normal' },
            { id: 'b', name: '1 plátano pequeño (100g) — carbos rápidos', kcal: 95, prot: 1, carbs: 23, grasa: 0, type: 'normal' },
            { id: 'c', name: '200ml agua con electrolitos + café solo', kcal: 10, prot: 0, carbs: 2, grasa: 0, type: 'normal' },
            { id: 'd', name: '2 dátiles + café solo — carbos rápidos y fáciles', kcal: 80, prot: 1, carbs: 20, grasa: 0, type: 'normal' },
          ],
        },
        {
          id: 'post',
          title: 'Post-carrera — desayuno de recuperación',
          time: '9:00h (máx. 30 min)',
          kcal: 750,
          prot: 50,
          tag: 'post-carrera',
          noteType: 'g',
          note: 'Toma más importante del día. Glucógeno bajo, ventana anabólica abierta. Carbos altos + proteína rápida.',
          options: [
            { id: 'a', name: 'Batido Chocolate Plátano: 40g whey chocolate + 200ml leche prot + 80g avena + 1 plátano + 5g cacao', kcal: 720, prot: 52, carbs: 80, grasa: 12, type: 'normal', recipe: R.batido1 },
            { id: 'b', name: 'Porridge: 80g avena + 200ml leche prot desnatada + 120ml claras + 1 huevo + 1 plátano + 10g miel', kcal: 730, prot: 50, carbs: 80, grasa: 14, type: 'normal', recipe: R.tort },
            { id: 'c', name: 'Batido Vainilla Avena: 40g whey vainilla + 200ml leche prot + 80g avena + 10g mantequilla cacahuete + 1 plátano', kcal: 720, prot: 54, carbs: 76, grasa: 14, type: 'normal', recipe: R.batido3 },
            { id: 'd', name: '200g Skyr natural + 80g avena + 1 plátano + 10g miel + 2 huevos cocidos', kcal: 700, prot: 50, carbs: 78, grasa: 14, type: 'yogur' },
            { id: 'e', name: '3 tostadas Oroweat + 120ml claras + 2 huevos revueltos + 60g pechuga de pavo + 1 naranja', kcal: 660, prot: 48, carbs: 62, grasa: 16, type: 'rapida', recipe: R.tort },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 780,
          prot: 50,
          noteType: '',
          note: 'Comida completa. El cuerpo sigue reponiendo glucógeno tras la carrera. Elige el carbo.',
          options: [
            {
              id: 'a',
              name: '150g pollo (air fryer) + carbo a elegir: 80g arroz / 70g pasta / 200g gnocchi + salsa tomate + 10ml AOVE + yogur straciatella (120g)',
              kcal: 740, prot: 48, carbs: 74, grasa: 14,
              type: 'airfryer',
              recipe: R.afc,
              comp: '+ yogur straciatella compensa los 50g menos de pollo',
            },
            { id: 'b', name: `200g salmón (air fryer) + 200g boniato + ${veg('espárragos')} + 10ml AOVE`, kcal: 780, prot: 44, carbs: 64, grasa: 28, type: 'airfryer', recipe: R.afs },
            {
              id: 'c',
              name: '150g ternera/carne picada (air fryer) + patatas air fryer (200g) + spray aceite + yogur straciatella (120g)',
              kcal: 760, prot: 50, carbs: 70, grasa: 18,
              type: 'airfryer',
              recipe: R.afpt,
              comp: '+ yogur straciatella compensa los 50g menos de carne',
            },
            {
              id: 'd',
              name: 'Bocadillo: pan blanco (120g) + proteína a elegir: 120g pechuga de pavo / 80g jamón serrano + AOVE + 1 fruta',
              kcal: 725, prot: 43, carbs: 77, grasa: 15,
              type: 'rapida',
              recipe: R.boca,
              comp: 'Pavo: más proteína, menos grasa. Jamón: más sabor, algo más de grasa.',
            },
          ],
        },
        {
          id: 'cena',
          title: 'Cena',
          time: '21:00h',
          kcal: 620,
          prot: 44,
          noteType: '',
          note: 'Proteína alta, carbos bajos. La recuperación muscular sigue durante el sueño.',
          options: [
            { id: 'a', name: `200g salmón (air fryer) + ${veg('ensalada')} + 15ml AOVE`, kcal: 510, prot: 42, carbs: 8, grasa: 32, type: 'airfryer', recipe: R.afs },
            { id: 'b', name: `150g pollo (air fryer) + ${veg('brócoli')} + 2 huevos plancha + 10ml AOVE + yogur straciatella (120g)`, kcal: 520, prot: 48, carbs: 10, grasa: 22, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'c', name: `Tortilla (120ml claras + 2 huevos) + atún al natural (80g) + ${veg('champiñones')} + 10ml AOVE`, kcal: 500, prot: 42, carbs: 4, grasa: 28, type: 'normal', recipe: R.tort },
            { id: 'd', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 620, prot: 58, carbs: 38, grasa: 22, type: 'airfryer', recipe: R.pizza },
          ],
        },
      ],
    },
  },

  descanso: {
    main: {
      macros: { kcal: 1880, prot: 148, carbs: 148, grasa: 68 },
      dayNote: 'Día de descanso: 3 tomas, sin ventana anabólica. Proteína alta para no perder músculo. Carbos bajos.',
      timeline: [
        { time: '9:00', label: 'Desayuno', type: 'i' },
        { time: '14:00', label: 'Comida', type: 'i' },
        { time: '21:00', label: 'Cena', type: 'i' },
      ],
      meals: [
        {
          id: 'desayuno',
          title: 'Desayuno',
          time: '9:00h',
          kcal: 500,
          prot: 38,
          noteType: '',
          note: 'Sin prisa. Proteína alta, carbos moderados.',
          options: [
            { id: 'b', name: '2 tostadas Oroweat + 120ml claras + 1 huevo revuelto + 60g pechuga de pavo loncheada', kcal: 490, prot: 40, carbs: 44, grasa: 12, type: 'rapida', recipe: R.tort },
            { id: 'c', name: '2 tostadas Oroweat + 1/2 aguacate (70g) + 120ml claras + 1 huevo + arándanos (80g)', kcal: 540, prot: 32, carbs: 46, grasa: 22, type: 'normal' },
            { id: 'd', name: 'Bol: yogur straciatella (120g) + 200ml leche prot desnatada + 50g avena + arándanos (80g) + 10g miel', kcal: 470, prot: 28, carbs: 66, grasa: 6, type: 'yogur' },
            { id: 'e', name: 'Bocadillo: pan blanco (70g) + 60g jamón serrano + 1/4 aguacate + café leche prot', kcal: 470, prot: 34, carbs: 44, grasa: 18, type: 'rapida', recipe: R.boca },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 780,
          prot: 52,
          noteType: '',
          note: 'Comida principal. Carbos moderados.',
          options: [
            {
              id: 'a',
              name: '150g pollo (air fryer) + carbo a elegir: 60g arroz / 50g pasta / 150g gnocchi + salsa tomate + 10ml AOVE + yogur straciatella (120g)',
              kcal: 640, prot: 48, carbs: 54, grasa: 12,
              type: 'airfryer',
              recipe: R.afc,
              comp: '+ yogur straciatella compensa los 50g menos de pollo',
            },
            { id: 'b', name: `200g salmón (air fryer) + 150g patata air fryer + spray aceite + ${veg('ensalada')} + 10ml AOVE`, kcal: 660, prot: 42, carbs: 50, grasa: 28, type: 'airfryer', recipe: R.afs },
            {
              id: 'c',
              name: '150g ternera/carne picada (air fryer) + patatas air fryer (150g) + spray aceite + yogur straciatella (120g)',
              kcal: 650, prot: 48, carbs: 46, grasa: 18,
              type: 'airfryer',
              recipe: R.afpt,
              comp: '+ yogur straciatella compensa los 50g menos de carne',
            },
            { id: 'd', name: `200g merluza (air fryer) + 150g patata air fryer + spray aceite + ${veg('verduras')} + 10ml AOVE`, kcal: 600, prot: 44, carbs: 50, grasa: 12, type: 'airfryer', recipe: R.afm },
          ],
        },
        {
          id: 'cena',
          title: 'Cena',
          time: '21:00h',
          kcal: 490,
          prot: 44,
          noteType: '',
          note: 'Cena ligera. Sin carbos almidonados.',
          options: [
            { id: 'a', name: `200g salmón (air fryer) + ${veg('ensalada')} + 10ml AOVE`, kcal: 480, prot: 42, carbs: 6, grasa: 30, type: 'airfryer', recipe: R.afs },
            { id: 'b', name: `150g pollo (air fryer) + ${veg('brócoli')} + 2 huevos plancha + 10ml AOVE + yogur straciatella (120g)`, kcal: 510, prot: 46, carbs: 8, grasa: 20, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'c', name: `Tortilla (120ml claras + 2 huevos) + atún al natural (80g) + ${veg('champiñones')} + 10ml AOVE`, kcal: 490, prot: 42, carbs: 4, grasa: 28, type: 'normal', recipe: R.tort },
            { id: 'd', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 600, prot: 58, carbs: 36, grasa: 20, type: 'airfryer', recipe: R.pizza },
          ],
        },
      ],
    },
  },
}
