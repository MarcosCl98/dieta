export type DayType = 'fuerza' | 'cardio' | 'descanso'
export type ScheduleType = 'tarde' | 'manana'

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
  afc: 'Air fryer: 150g pechuga entera, 180°C, 15-16 min dando la vuelta a mitad. Sazona con ajo en polvo, pimentón y sal.',
  afs: 'Air fryer: filete de salmón, 180°C, 10-12 min sin dar vuelta. Unas gotas de limón.',
  afp: 'Air fryer: filetes de pavo, 180°C, 12-14 min. Marinar 5 min con limón y orégano.',
  afm: 'Air fryer: lomo de merluza, 180°C, 10-12 min. AOVE, sal y perejil.',
  afh: 'Air fryer hamburguesa: forma una hamburguesa con 150g de carne de cerdo ibérico picada. 180°C, 14-16 min dando vuelta a mitad. 2 lonchas queso encima el último minuto. Pan brioche tostado 2 min aparte.',
  pizza: 'Pizza cottage (air fryer): mezcla 200g cottage + 2 huevos + 40g avena triturada. Extiende en papel de horno. 180°C, 12-14 min. Añade topping los últimos 3-4 min.',
  boca: 'Rápido: tuesta el pan si quieres. Coloca el embutido y AOVE si quieres. Listo en 2 min.',
  tort: 'Tortilla: 120ml claras del frasco (= 4 claras) + 1 huevo entero. Bate, sartén a fuego medio-bajo, tapa 1 min y dobla. Air fryer: molde apto, 160°C, 8 min.',
  gnoc: 'Gnocchi: cuece en agua con sal 2-3 min (flotan cuando están listos). Saltea 1 min en sartén con AOVE. Añade la salsa directamente.',
}

function veg(txt: string) {
  return `${txt} [opcional]`
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
        {
          id: 'desayuno',
          title: 'Desayuno',
          time: '8:00h',
          kcal: 580,
          prot: 38,
          noteType: '',
          note: 'Aguacate o embutido, no los dos juntos para no disparar grasas.',
          options: [
            { id: 'a', name: 'Porridge: 80g avena + 200ml leche prot desnatada + 1 plátano + tortilla (120ml claras + 1 huevo)', kcal: 650, prot: 46, carbs: 72, grasa: 12, type: 'normal', recipe: R.tort },
            { id: 'b', name: '2 tostadas Oroweat + 120ml claras + 1 huevo revuelto + 60g pechuga de pavo loncheada', kcal: 490, prot: 40, carbs: 44, grasa: 12, type: 'rapida', recipe: R.tort },
            { id: 'c', name: '2 tostadas Oroweat + 1/2 aguacate (70g) + 120ml claras + 1 huevo + arándanos (80g)', kcal: 540, prot: 32, carbs: 46, grasa: 22, type: 'normal' },
            { id: 'd', name: 'Bol: yogur straciatella (120g) + 200ml leche prot desnatada + 60g avena + arándanos (80g) + 10g miel', kcal: 490, prot: 30, carbs: 72, grasa: 6, type: 'yogur' },
            { id: 'e', name: 'Bocadillo: pan blanco (80g) + 60g jamón serrano + café con leche prot desnatada', kcal: 470, prot: 36, carbs: 50, grasa: 16, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Batido: 30g whey + 200ml leche prot desnatada + 80g avena + 1 plátano', kcal: 640, prot: 50, carbs: 76, grasa: 10, type: 'normal' },
          ],
        },
        {
          id: 'comida',
          title: 'Comida — pre-entreno',
          time: '12:30h (2,5h antes)',
          kcal: 790,
          prot: 50,
          tag: 'pre-entreno',
          noteType: 'g',
          note: 'Tu toma más importante. Carbos altos para cargar glucógeno. Pan blanco válido aquí.',
          options: [
            { id: 'a', name: `150g pollo (air fryer) + 90g arroz + ${veg('verduras salteadas')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 740, prot: 50, carbs: 76, grasa: 14, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'b', name: `150g pollo (air fryer) + 200g gnocchi salteados + salsa tomate + 10ml AOVE + yogur straciatella (120g)`, kcal: 770, prot: 50, carbs: 80, grasa: 16, type: 'airfryer', recipe: R.gnoc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'c', name: `150g pollo (air fryer) + 80g pasta + salsa tomate + 10ml AOVE + 1 huevo duro`, kcal: 790, prot: 52, carbs: 82, grasa: 16, type: 'airfryer', recipe: R.afc, comp: '+ huevo duro compensa los 50g menos de pollo' },
            { id: 'd', name: `150g ternera magra/carne picada + 200g patata cocida + ${veg('ensalada')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 760, prot: 50, carbs: 74, grasa: 18, type: 'normal', comp: '+ yogur straciatella compensa los 50g menos de carne' },
            { id: 'e', name: 'Bocadillo: pan blanco (120g) + 120g pechuga de pavo loncheada + AOVE + 1 fruta', kcal: 720, prot: 44, carbs: 76, grasa: 12, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Bocadillo: pan blanco (120g) + 80g jamón serrano + AOVE + 1 fruta', kcal: 730, prot: 42, carbs: 76, grasa: 18, type: 'rapida', recipe: R.boca },
          ],
        },
        {
          id: 'post',
          title: 'Post-entreno',
          time: '17:00h (máx. 30 min)',
          kcal: 295,
          prot: 32,
          noteType: 'a',
          note: 'Ventana anabólica. Proteína rápida + carbos simples. No lo saltes.',
          options: [
            { id: 'a', name: '30g whey + agua + 1 plátano grande', kcal: 270, prot: 26, carbs: 40, grasa: 2, type: 'normal' },
            { id: 'b', name: '30g whey + 200ml leche prot desnatada + 1 fruta', kcal: 300, prot: 36, carbs: 28, grasa: 4, type: 'normal' },
            { id: 'c', name: 'Yogur straciatella (120g) + 200ml leche prot desnatada + 1 plátano', kcal: 280, prot: 28, carbs: 38, grasa: 4, type: 'yogur' },
            { id: 'd', name: '200g Skyr natural proteína + 1 plátano + 20g avena', kcal: 310, prot: 30, carbs: 44, grasa: 2, type: 'yogur' },
            { id: 'e', name: '120ml claras + 1 huevo revuelto + 1 tostada Oroweat + 1 plátano', kcal: 350, prot: 30, carbs: 42, grasa: 8, type: 'normal', recipe: R.tort },
          ],
        },
        {
          id: 'cena',
          title: 'Cena',
          time: '21:00h',
          kcal: 610,
          prot: 44,
          noteType: '',
          note: 'Proteína alta, carbos bajos. Sin arroz ni pasta.',
          options: [
            { id: 'a', name: `200g salmón (air fryer) + ${veg('ensalada')} + 15ml AOVE`, kcal: 510, prot: 42, carbs: 8, grasa: 32, type: 'airfryer', recipe: R.afs },
            { id: 'b', name: `150g pollo (air fryer) + ${veg('brócoli al vapor')} + 2 huevos plancha + 10ml AOVE + yogur straciatella (120g)`, kcal: 520, prot: 48, carbs: 10, grasa: 22, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'c', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 620, prot: 58, carbs: 38, grasa: 22, type: 'airfryer', recipe: R.pizza },
            { id: 'd', name: `Tortilla (120ml claras + 2 huevos) + ${veg('espinacas + champiñones')} + 10ml AOVE`, kcal: 490, prot: 36, carbs: 8, grasa: 32, type: 'normal', recipe: R.tort },
            { id: 'e', name: 'Bocadillo: pan blanco (60g) + 60g pechuga de pavo loncheada + 1/4 aguacate', kcal: 400, prot: 30, carbs: 40, grasa: 12, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Hamburguesa ibérica: 150g cerdo ibérico picado + 2 lonchas queso + pan brioche', kcal: 680, prot: 40, carbs: 40, grasa: 36, type: 'ocasional', recipe: R.afh },
          ],
        },
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
          note: 'El plato más importante del día. Sin aguacate aquí — los carbos mandan ahora.',
          options: [
            { id: 'a', name: 'Porridge: 80g avena + 200ml leche prot desnatada + 120ml claras + 1 huevo + 1 plátano + 10g miel', kcal: 730, prot: 50, carbs: 80, grasa: 14, type: 'normal' },
            { id: 'b', name: 'Batido: 40g whey + 200ml leche prot desnatada + 80g avena + 1 plátano', kcal: 700, prot: 56, carbs: 76, grasa: 12, type: 'normal' },
            { id: 'c', name: '200g Skyr natural + 80g avena + 1 plátano + 10g miel + 2 huevos cocidos', kcal: 700, prot: 50, carbs: 78, grasa: 14, type: 'yogur' },
            { id: 'd', name: '3 tostadas Oroweat + 120ml claras + 2 huevos revueltos + 60g pechuga de pavo loncheada + 1 naranja', kcal: 660, prot: 48, carbs: 62, grasa: 16, type: 'rapida', recipe: R.tort },
            { id: 'e', name: 'Bocadillo: pan blanco (100g) + 120ml claras + 2 huevos revueltos + 60g jamón serrano + 1 plátano', kcal: 710, prot: 50, carbs: 68, grasa: 20, type: 'rapida' },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 770,
          prot: 50,
          noteType: '',
          note: 'Comida completa. Carbos moderados.',
          options: [
            { id: 'a', name: `150g pollo (air fryer) + 80g arroz + ${veg('verduras')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 720, prot: 48, carbs: 72, grasa: 14, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'b', name: `200g salmón (air fryer) + 200g boniato + ${veg('espárragos')} + 10ml AOVE`, kcal: 780, prot: 44, carbs: 64, grasa: 28, type: 'airfryer', recipe: R.afs },
            { id: 'c', name: `150g pollo (air fryer) + 200g gnocchi salteados + salsa tomate + 10ml AOVE + 1 huevo duro`, kcal: 780, prot: 50, carbs: 80, grasa: 18, type: 'airfryer', recipe: R.gnoc, comp: '+ huevo duro compensa los 50g menos de pollo' },
            { id: 'd', name: 'Bocadillo: pan blanco (120g) + 80g jamón serrano + AOVE + 1 fruta', kcal: 730, prot: 42, carbs: 78, grasa: 18, type: 'rapida', recipe: R.boca },
            { id: 'e', name: `150g ternera magra/carne picada + 200g patata + ${veg('ensalada')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 750, prot: 50, carbs: 70, grasa: 18, type: 'normal', comp: '+ yogur straciatella compensa los 50g menos de carne' },
          ],
        },
        {
          id: 'cena',
          title: 'Cena',
          time: '21:00h',
          kcal: 610,
          prot: 44,
          noteType: '',
          note: 'Proteína alta, carbos bajos.',
          options: [
            { id: 'a', name: `200g salmón (air fryer) + ${veg('ensalada')} + 15ml AOVE`, kcal: 510, prot: 42, carbs: 8, grasa: 32, type: 'airfryer', recipe: R.afs },
            { id: 'b', name: `150g pollo (air fryer) + ${veg('brócoli')} + 2 huevos plancha + 10ml AOVE + yogur straciatella (120g)`, kcal: 520, prot: 48, carbs: 10, grasa: 22, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'c', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 620, prot: 58, carbs: 38, grasa: 22, type: 'airfryer', recipe: R.pizza },
            { id: 'd', name: `Tortilla (120ml claras + 2 huevos) + ${veg('espinacas + champiñones')} + 10ml AOVE`, kcal: 490, prot: 36, carbs: 8, grasa: 32, type: 'normal', recipe: R.tort },
            { id: 'e', name: 'Bocadillo: pan blanco (60g) + 60g pechuga de pavo loncheada + 1/4 aguacate', kcal: 400, prot: 30, carbs: 40, grasa: 12, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Hamburguesa ibérica: 150g cerdo ibérico picado + 2 lonchas queso + pan brioche', kcal: 680, prot: 40, carbs: 40, grasa: 36, type: 'ocasional', recipe: R.afh },
          ],
        },
      ],
    },
  },
  cardio: {
    // Cardio = carrera ~8km a primera hora. Un solo horario, siempre mañana.
    main: {
      macros: { kcal: 2300, prot: 150, carbs: 240, grasa: 72 },
      dayNote: 'Día de carrera (~8km). Sales a primera hora en ayunas o con algo mínimo. El post-carrera es la toma más importante: necesitas carbos + proteína para recuperar glucógeno muscular después del esfuerzo.',
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
          note: 'Para 8km no necesitas comer antes. En ayunas funciona perfectamente si estás acostumbrado. Si notas que te quedas sin energía a mitad, toma algo mínimo y muy digestivo — nada sólido ni graso.',
          options: [
            { id: 'a', name: 'Nada — carrera en ayunas (recomendado si te va bien)', kcal: 0, prot: 0, carbs: 0, grasa: 0, type: 'normal' },
            { id: 'b', name: '1 plátano pequeño (100g) — carbos rápidos sin digestión pesada', kcal: 95, prot: 1, carbs: 23, grasa: 0, type: 'normal' },
            { id: 'c', name: '200ml agua con electrolitos + café solo', kcal: 10, prot: 0, carbs: 2, grasa: 0, type: 'normal' },
            { id: 'd', name: '1 gel energético o dátiles (2 uds) — solo si la carrera es intensa', kcal: 80, prot: 1, carbs: 20, grasa: 0, type: 'normal' },
          ],
        },
        {
          id: 'post',
          title: 'Post-carrera — desayuno de recuperación',
          time: '9:00h (nada más llegar, máx. 30 min)',
          kcal: 750,
          prot: 50,
          tag: 'post-carrera',
          noteType: 'g',
          note: 'Aquí está el trabajo. Después de 8km tienes el glucógeno muscular bajo y una ventana anabólica abierta. Carbos altos + proteína rápida. Es la toma más importante del día de carrera — no la saltes aunque no tengas hambre.',
          options: [
            { id: 'a', name: 'Porridge: 80g avena + 200ml leche prot desnatada + 120ml claras + 1 huevo + 1 plátano + 10g miel', kcal: 730, prot: 50, carbs: 80, grasa: 14, type: 'normal' },
            { id: 'b', name: 'Batido: 40g whey + 200ml leche prot desnatada + 80g avena + 1 plátano + 10g miel', kcal: 720, prot: 54, carbs: 78, grasa: 12, type: 'normal' },
            { id: 'c', name: '200g Skyr natural + 80g avena + 1 plátano + 10g miel + 2 huevos cocidos', kcal: 700, prot: 50, carbs: 78, grasa: 14, type: 'yogur' },
            { id: 'd', name: '3 tostadas Oroweat + 120ml claras + 2 huevos revueltos + 60g pechuga de pavo + 1 naranja', kcal: 660, prot: 48, carbs: 62, grasa: 16, type: 'rapida', recipe: R.tort },
            { id: 'e', name: 'Bocadillo: pan blanco (100g) + 120ml claras + 2 huevos revueltos + 60g jamón serrano + 1 plátano', kcal: 710, prot: 50, carbs: 68, grasa: 20, type: 'rapida' },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 780,
          prot: 50,
          noteType: '',
          note: 'Comida completa con carbos para seguir recuperando. El cuerpo sigue reponiendo glucógeno las horas siguientes a la carrera.',
          options: [
            { id: 'a', name: `150g pollo (air fryer) + 80g arroz + ${veg('verduras')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 720, prot: 48, carbs: 72, grasa: 14, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'b', name: `200g salmón (air fryer) + 200g boniato + ${veg('espárragos')} + 10ml AOVE`, kcal: 780, prot: 44, carbs: 64, grasa: 28, type: 'airfryer', recipe: R.afs },
            { id: 'c', name: `150g pollo (air fryer) + 200g gnocchi salteados + salsa tomate + 10ml AOVE + 1 huevo duro`, kcal: 780, prot: 50, carbs: 80, grasa: 18, type: 'airfryer', recipe: R.gnoc, comp: '+ huevo duro compensa los 50g menos de pollo' },
            { id: 'd', name: 'Bocadillo: pan blanco (120g) + 80g jamón serrano + AOVE + 1 fruta', kcal: 730, prot: 42, carbs: 78, grasa: 18, type: 'rapida', recipe: R.boca },
            { id: 'e', name: `150g ternera magra/carne picada + 200g patata + ${veg('ensalada')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 760, prot: 50, carbs: 70, grasa: 18, type: 'normal', comp: '+ yogur straciatella compensa los 50g menos de carne' },
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
            { id: 'c', name: `Tortilla (120ml claras + 2 huevos) + ${veg('espinacas + champiñones')} + 10ml AOVE`, kcal: 490, prot: 36, carbs: 8, grasa: 32, type: 'normal', recipe: R.tort },
            { id: 'd', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 620, prot: 58, carbs: 38, grasa: 22, type: 'airfryer', recipe: R.pizza },
            { id: 'e', name: 'Bocadillo: pan blanco (60g) + 60g pechuga de pavo loncheada + 1/4 aguacate', kcal: 400, prot: 30, carbs: 40, grasa: 12, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Hamburguesa ibérica: 150g cerdo ibérico picado + 2 lonchas queso + pan brioche', kcal: 680, prot: 40, carbs: 40, grasa: 36, type: 'ocasional', recipe: R.afh },
          ],
        },
      ],
    },
  },
  descanso: {
    main: {
      macros: { kcal: 1880, prot: 148, carbs: 148, grasa: 68 },
      dayNote: 'Día de descanso: 3 tomas, sin ventana anabólica. Proteína alta para no perder músculo. Carbos bajos — el cuerpo tira de reservas.',
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
            { id: 'a', name: 'Porridge: 60g avena + 200ml leche prot desnatada + 120ml claras + 1 huevo', kcal: 510, prot: 42, carbs: 54, grasa: 12, type: 'normal', recipe: R.tort },
            { id: 'b', name: '2 tostadas Oroweat + 120ml claras + 1 huevo revuelto + 60g pechuga de pavo loncheada', kcal: 490, prot: 40, carbs: 44, grasa: 12, type: 'rapida', recipe: R.tort },
            { id: 'c', name: '2 tostadas Oroweat + 1/2 aguacate (70g) + 120ml claras + 1 huevo + arándanos (80g)', kcal: 540, prot: 32, carbs: 46, grasa: 22, type: 'normal' },
            { id: 'd', name: 'Bol: yogur straciatella (120g) + 200ml leche prot desnatada + 50g avena + arándanos (80g) + 10g miel', kcal: 470, prot: 28, carbs: 66, grasa: 6, type: 'yogur' },
            { id: 'e', name: 'Bocadillo: pan blanco (70g) + 60g jamón serrano + 1/4 aguacate + café leche prot', kcal: 470, prot: 34, carbs: 44, grasa: 18, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Batido: 30g whey + 200ml leche prot desnatada + 60g avena + arándanos (80g)', kcal: 520, prot: 48, carbs: 56, grasa: 8, type: 'normal' },
          ],
        },
        {
          id: 'comida',
          title: 'Comida',
          time: '14:00h',
          kcal: 780,
          prot: 52,
          noteType: '',
          note: 'Comida principal. Carbos moderados. Verduras completamente opcionales.',
          options: [
            { id: 'a', name: `150g pollo (air fryer) + 60g arroz + ${veg('verduras')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 640, prot: 48, carbs: 54, grasa: 12, type: 'airfryer', recipe: R.afc, comp: '+ yogur straciatella compensa los 50g menos de pollo' },
            { id: 'b', name: `200g salmón (air fryer) + 150g patata + ${veg('ensalada')} + 10ml AOVE`, kcal: 660, prot: 42, carbs: 50, grasa: 28, type: 'airfryer', recipe: R.afs },
            { id: 'c', name: `150g pollo (air fryer) + 150g gnocchi salteados + salsa tomate + 10ml AOVE + 1 huevo duro`, kcal: 650, prot: 48, carbs: 56, grasa: 14, type: 'airfryer', recipe: R.gnoc, comp: '+ huevo duro compensa los 50g menos de pollo' },
            { id: 'd', name: 'Bocadillo: pan blanco (100g) + 80g jamón serrano + AOVE', kcal: 570, prot: 36, carbs: 56, grasa: 16, type: 'rapida', recipe: R.boca },
            { id: 'e', name: `150g ternera magra/carne picada + 150g patata + ${veg('ensalada')} + 10ml AOVE + yogur straciatella (120g)`, kcal: 650, prot: 48, carbs: 46, grasa: 18, type: 'normal', comp: '+ yogur straciatella compensa los 50g menos de carne' },
            { id: 'f', name: `200g merluza (air fryer) + 150g patata + ${veg('verduras')} + 10ml AOVE`, kcal: 600, prot: 44, carbs: 50, grasa: 12, type: 'airfryer', recipe: R.afm },
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
            { id: 'c', name: `Tortilla (120ml claras + 2 huevos) + ${veg('espinacas + champiñones')} + 10ml AOVE`, kcal: 490, prot: 36, carbs: 8, grasa: 32, type: 'normal', recipe: R.tort },
            { id: 'd', name: 'Pizza de cottage (air fryer) + mozzarella light (60g) + atún (80g)', kcal: 600, prot: 58, carbs: 36, grasa: 20, type: 'airfryer', recipe: R.pizza },
            { id: 'e', name: 'Bocadillo ligero: pan blanco (50g) + 60g pechuga de pavo loncheada', kcal: 340, prot: 26, carbs: 36, grasa: 6, type: 'rapida', recipe: R.boca },
            { id: 'f', name: 'Hamburguesa ibérica: 150g cerdo ibérico picado + 2 lonchas queso + pan brioche', kcal: 680, prot: 40, carbs: 40, grasa: 36, type: 'ocasional', recipe: R.afh },
          ],
        },
      ],
    },
  },
}
