'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, RefreshCw, Plus, AlertCircle, ChevronRight } from 'lucide-react'

interface FoodResult {
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  source: string
  per100g: { kcal: number; prot: number; carbs: number; grasa: number }
}

interface Candidate {
  id: string
  name: string
  brand: string | null
  description: string | null
}

interface FoodItem {
  name: string
  grams: number
  kcal: number
  prot: number
  carbs: number
  grasa: number
}

interface FoodSearchModalProps {
  onClose: () => void
  onSave: (items: FoodItem[], totalKcal: number, totalProt: number, note: string) => void
  initialNote?: string
}

// ── Local reference table (per 100g) — 289 alimentos ──
const REF: Record<string, { kcal: number; prot: number; carbs: number; grasa: number; label: string }> = {
  'pechuga de pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo' },
  'pechuga pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo' },
  'pollo asado': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo asado' },
  'pollo': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo' },
  'muslo de pollo': { kcal: 209, prot: 24, carbs: 0, grasa: 13, label: 'Muslo de pollo' },
  'pavo': { kcal: 135, prot: 29, carbs: 0, grasa: 1.5, label: 'Pechuga de pavo' },
  'pechuga pavo': { kcal: 135, prot: 29, carbs: 0, grasa: 1.5, label: 'Pechuga de pavo' },
  'ternera': { kcal: 250, prot: 26, carbs: 0, grasa: 17, label: 'Ternera' },
  'solomillo': { kcal: 180, prot: 28, carbs: 0, grasa: 7, label: 'Solomillo' },
  'carne picada': { kcal: 254, prot: 26, carbs: 0, grasa: 17, label: 'Carne picada' },
  'carne picada de cerdo': { kcal: 263, prot: 17, carbs: 0, grasa: 22, label: 'Carne picada de cerdo' },
  'cerdo': { kcal: 242, prot: 27, carbs: 0, grasa: 14, label: 'Cerdo' },
  'cerdo iberico': { kcal: 280, prot: 25, carbs: 0, grasa: 20, label: 'Cerdo ibérico' },
  'costillas': { kcal: 277, prot: 18, carbs: 0, grasa: 23, label: 'Costillas de cerdo' },
  'jamon serrano': { kcal: 241, prot: 30, carbs: 0, grasa: 13, label: 'Jamón serrano' },
  'jamon iberico': { kcal: 375, prot: 28, carbs: 1, grasa: 30, label: 'Jamón ibérico' },
  'jamon cocido': { kcal: 120, prot: 18, carbs: 1, grasa: 5, label: 'Jamón cocido' },
  'chorizo': { kcal: 455, prot: 24, carbs: 1.9, grasa: 40, label: 'Chorizo' },
  'salchichon': { kcal: 432, prot: 26, carbs: 1, grasa: 37, label: 'Salchichón' },
  'lomo': { kcal: 199, prot: 22, carbs: 0, grasa: 12, label: 'Lomo embuchado' },
  'bacon': { kcal: 458, prot: 12, carbs: 0.7, grasa: 45, label: 'Bacon' },
  'salchicha': { kcal: 330, prot: 12, carbs: 3, grasa: 30, label: 'Salchicha' },
  'salchicha frankfurt': { kcal: 285, prot: 12, carbs: 3, grasa: 26, label: 'Salchicha frankfurt' },
  'mortadela': { kcal: 285, prot: 14, carbs: 2, grasa: 25, label: 'Mortadela' },
  'salmon': { kcal: 208, prot: 20, carbs: 0, grasa: 13, label: 'Salmón' },
  'merluza': { kcal: 86, prot: 17, carbs: 0, grasa: 2, label: 'Merluza' },
  'atun': { kcal: 132, prot: 28, carbs: 0, grasa: 1, label: 'Atún' },
  'atun lata': { kcal: 116, prot: 25, carbs: 0, grasa: 1.5, label: 'Atún en lata' },
  'bacalao': { kcal: 82, prot: 18, carbs: 0, grasa: 0.7, label: 'Bacalao' },
  'dorada': { kcal: 96, prot: 18, carbs: 0, grasa: 3, label: 'Dorada' },
  'lubina': { kcal: 98, prot: 19, carbs: 0, grasa: 2.5, label: 'Lubina' },
  'sardina': { kcal: 208, prot: 25, carbs: 0, grasa: 12, label: 'Sardina' },
  'caballa': { kcal: 191, prot: 19, carbs: 0, grasa: 12, label: 'Caballa' },
  'boqueron': { kcal: 131, prot: 20, carbs: 0, grasa: 6, label: 'Boquerón' },
  'gambas': { kcal: 99, prot: 24, carbs: 0, grasa: 0.5, label: 'Gambas' },
  'langostinos': { kcal: 90, prot: 19, carbs: 0, grasa: 1, label: 'Langostinos' },
  'calamar': { kcal: 92, prot: 16, carbs: 3, grasa: 1.5, label: 'Calamar' },
  'mejillones': { kcal: 86, prot: 12, carbs: 4, grasa: 2, label: 'Mejillones' },
  'pulpo': { kcal: 82, prot: 15, carbs: 2, grasa: 1, label: 'Pulpo' },
  'huevo': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero' },
  'huevo entero': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero' },
  'clara de huevo': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo' },
  'claras': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo' },
  'yema': { kcal: 322, prot: 16, carbs: 3.6, grasa: 27, label: 'Yema de huevo' },
  'leche entera': { kcal: 61, prot: 3.2, carbs: 4.8, grasa: 3.3, label: 'Leche entera' },
  'leche semidesnatada': { kcal: 42, prot: 3.4, carbs: 4.8, grasa: 1, label: 'Leche semidesnatada' },
  'leche desnatada': { kcal: 35, prot: 3.4, carbs: 4.9, grasa: 0.2, label: 'Leche desnatada' },
  'leche': { kcal: 42, prot: 3.4, carbs: 4.8, grasa: 1, label: 'Leche semidesnatada' },
  'yogur natural': { kcal: 59, prot: 3.5, carbs: 4.7, grasa: 3.3, label: 'Yogur natural' },
  'yogur desnatado': { kcal: 45, prot: 4.5, carbs: 6, grasa: 0.1, label: 'Yogur desnatado' },
  'yogur griego': { kcal: 97, prot: 9, carbs: 3.6, grasa: 5, label: 'Yogur griego' },
  'yogur griego 0%': { kcal: 65, prot: 10, carbs: 4, grasa: 0.2, label: 'Yogur griego 0%' },
  'skyr': { kcal: 63, prot: 11, carbs: 4, grasa: 0.2, label: 'Skyr natural' },
  'skyr natural': { kcal: 63, prot: 11, carbs: 4, grasa: 0.2, label: 'Skyr natural' },
  'yogur proteico': { kcal: 68, prot: 10, carbs: 5, grasa: 0.5, label: 'Yogur proteico' },
  'yogur straciatella dia': { kcal: 54, prot: 12, carbs: 3.5, grasa: 0.3, label: 'Yogur straciatella Día proteína (120g)' },
  'yogur dia proteina': { kcal: 54, prot: 12, carbs: 3.5, grasa: 0.3, label: 'Yogur proteína Día (120g)' },
  'danone activia': { kcal: 70, prot: 4, carbs: 9.5, grasa: 1.8, label: 'Danone Activia natural' },
  'danone griego': { kcal: 110, prot: 7, carbs: 5, grasa: 6.5, label: 'Danone Griego' },
  'oikos danone': { kcal: 95, prot: 8, carbs: 6, grasa: 3.5, label: 'Oikos Danone' },
  'queso': { kcal: 402, prot: 25, carbs: 1.3, grasa: 33, label: 'Queso' },
  'queso manchego': { kcal: 392, prot: 27, carbs: 0.5, grasa: 32, label: 'Queso manchego' },
  'queso fresco': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Queso fresco' },
  'queso brie': { kcal: 334, prot: 20, carbs: 0.5, grasa: 28, label: 'Queso brie' },
  'queso cheddar': { kcal: 403, prot: 25, carbs: 1.3, grasa: 33, label: 'Queso cheddar' },
  'mozzarella': { kcal: 280, prot: 28, carbs: 2.2, grasa: 17, label: 'Mozzarella' },
  'mozzarella light': { kcal: 170, prot: 24, carbs: 2, grasa: 7, label: 'Mozzarella light' },
  'requesón': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Requesón' },
  'cottage': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Cottage cheese' },
  'nata': { kcal: 292, prot: 2.4, carbs: 3, grasa: 30, label: 'Nata para cocinar' },
  'mantequilla': { kcal: 717, prot: 0.9, carbs: 0.1, grasa: 81, label: 'Mantequilla' },
  'avena': { kcal: 389, prot: 17, carbs: 66, grasa: 7, label: 'Avena' },
  'copos de avena': { kcal: 389, prot: 17, carbs: 66, grasa: 7, label: 'Copos de avena' },
  'arroz blanco cocido': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz blanco cocido' },
  'arroz blanco': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz blanco cocido' },
  'arroz': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz cocido' },
  'arroz crudo': { kcal: 365, prot: 7, carbs: 79, grasa: 0.7, label: 'Arroz crudo' },
  'arroz integral': { kcal: 123, prot: 2.7, carbs: 25, grasa: 1, label: 'Arroz integral cocido' },
  'pasta cocida': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Pasta cocida' },
  'pasta': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Pasta cocida' },
  'pasta integral': { kcal: 124, prot: 5.3, carbs: 23, grasa: 1.2, label: 'Pasta integral cocida' },
  'pasta cruda': { kcal: 371, prot: 13, carbs: 74, grasa: 1.5, label: 'Pasta cruda' },
  'espaguetis': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Espaguetis cocidos' },
  'macarrones': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Macarrones cocidos' },
  'gnocchi': { kcal: 130, prot: 3, carbs: 27, grasa: 0.5, label: 'Gnocchi' },
  'quinoa': { kcal: 120, prot: 4.4, carbs: 22, grasa: 1.9, label: 'Quinoa cocida' },
  'pan blanco': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan blanco' },
  'pan integral': { kcal: 247, prot: 13, carbs: 41, grasa: 4, label: 'Pan integral' },
  'pan': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan' },
  'pan de molde': { kcal: 265, prot: 8, carbs: 49, grasa: 4, label: 'Pan de molde' },
  'pan brioche': { kcal: 320, prot: 8, carbs: 47, grasa: 11, label: 'Pan brioche' },
  'baguette': { kcal: 270, prot: 9, carbs: 53, grasa: 2, label: 'Baguette' },
  'tostada': { kcal: 265, prot: 9, carbs: 49, grasa: 3, label: 'Pan tostado' },
  'tortita de avena': { kcal: 370, prot: 14, carbs: 63, grasa: 7, label: 'Tortita de avena' },
  'cereales': { kcal: 375, prot: 7, carbs: 80, grasa: 2, label: 'Cereales desayuno' },
  'corn flakes': { kcal: 357, prot: 7.5, carbs: 84, grasa: 0.5, label: 'Corn flakes' },
  'granola': { kcal: 471, prot: 10, carbs: 57, grasa: 21, label: 'Granola' },
  'muesli': { kcal: 360, prot: 9, carbs: 65, grasa: 7, label: 'Muesli' },
  'lentejas': { kcal: 116, prot: 9, carbs: 20, grasa: 0.4, label: 'Lentejas cocidas' },
  'garbanzos': { kcal: 164, prot: 9, carbs: 27, grasa: 2.6, label: 'Garbanzos cocidos' },
  'alubias': { kcal: 127, prot: 9, carbs: 23, grasa: 0.5, label: 'Alubias cocidas' },
  'edamame': { kcal: 122, prot: 11, carbs: 10, grasa: 5, label: 'Edamame' },
  'patata': { kcal: 77, prot: 2, carbs: 17, grasa: 0.1, label: 'Patata cocida' },
  'patata cocida': { kcal: 77, prot: 2, carbs: 17, grasa: 0.1, label: 'Patata cocida' },
  'boniato': { kcal: 86, prot: 1.6, carbs: 20, grasa: 0.1, label: 'Boniato cocido' },
  'brocoli': { kcal: 34, prot: 2.8, carbs: 7, grasa: 0.4, label: 'Brócoli' },
  'espinacas': { kcal: 23, prot: 2.9, carbs: 3.6, grasa: 0.4, label: 'Espinacas' },
  'tomate': { kcal: 18, prot: 0.9, carbs: 3.9, grasa: 0.2, label: 'Tomate' },
  'lechuga': { kcal: 15, prot: 1.4, carbs: 2.9, grasa: 0.2, label: 'Lechuga' },
  'pepino': { kcal: 16, prot: 0.7, carbs: 3.6, grasa: 0.1, label: 'Pepino' },
  'zanahoria': { kcal: 41, prot: 0.9, carbs: 10, grasa: 0.2, label: 'Zanahoria' },
  'cebolla': { kcal: 40, prot: 1.1, carbs: 9.3, grasa: 0.1, label: 'Cebolla' },
  'pimiento': { kcal: 31, prot: 1, carbs: 6, grasa: 0.3, label: 'Pimiento' },
  'champiñones': { kcal: 22, prot: 3.1, carbs: 3.3, grasa: 0.3, label: 'Champiñones' },
  'esparragos': { kcal: 20, prot: 2.2, carbs: 3.7, grasa: 0.1, label: 'Espárragos' },
  'judias verdes': { kcal: 31, prot: 1.8, carbs: 7, grasa: 0.1, label: 'Judías verdes' },
  'calabacin': { kcal: 17, prot: 1.2, carbs: 3.1, grasa: 0.3, label: 'Calabacín' },
  'berenjena': { kcal: 25, prot: 1, carbs: 6, grasa: 0.2, label: 'Berenjena' },
  'coliflor': { kcal: 25, prot: 1.9, carbs: 5, grasa: 0.3, label: 'Coliflor' },
  'aguacate': { kcal: 160, prot: 2, carbs: 9, grasa: 15, label: 'Aguacate' },
  'platano': { kcal: 89, prot: 1.1, carbs: 23, grasa: 0.3, label: 'Plátano' },
  'manzana': { kcal: 52, prot: 0.3, carbs: 14, grasa: 0.2, label: 'Manzana' },
  'naranja': { kcal: 47, prot: 0.9, carbs: 12, grasa: 0.1, label: 'Naranja' },
  'mandarina': { kcal: 53, prot: 0.8, carbs: 13, grasa: 0.3, label: 'Mandarina' },
  'kiwi': { kcal: 61, prot: 1.1, carbs: 15, grasa: 0.5, label: 'Kiwi' },
  'fresas': { kcal: 32, prot: 0.7, carbs: 8, grasa: 0.3, label: 'Fresas' },
  'arandanos': { kcal: 57, prot: 0.7, carbs: 14, grasa: 0.3, label: 'Arándanos' },
  'melocoton': { kcal: 39, prot: 0.9, carbs: 10, grasa: 0.3, label: 'Melocotón' },
  'pera': { kcal: 57, prot: 0.4, carbs: 15, grasa: 0.1, label: 'Pera' },
  'uvas': { kcal: 69, prot: 0.6, carbs: 18, grasa: 0.2, label: 'Uvas' },
  'sandia': { kcal: 30, prot: 0.6, carbs: 8, grasa: 0.2, label: 'Sandía' },
  'melon': { kcal: 34, prot: 0.8, carbs: 8, grasa: 0.2, label: 'Melón' },
  'pina': { kcal: 50, prot: 0.5, carbs: 13, grasa: 0.1, label: 'Piña' },
  'mango': { kcal: 60, prot: 0.8, carbs: 15, grasa: 0.4, label: 'Mango' },
  'cerezas': { kcal: 63, prot: 1.1, carbs: 16, grasa: 0.2, label: 'Cerezas' },
  'frambuesas': { kcal: 52, prot: 1.2, carbs: 12, grasa: 0.7, label: 'Frambuesas' },
  'datiles': { kcal: 282, prot: 2.5, carbs: 75, grasa: 0.4, label: 'Dátiles' },
  'almendras': { kcal: 579, prot: 21, carbs: 22, grasa: 50, label: 'Almendras' },
  'nueces': { kcal: 654, prot: 15, carbs: 14, grasa: 65, label: 'Nueces' },
  'cacahuetes': { kcal: 567, prot: 26, carbs: 16, grasa: 49, label: 'Cacahuetes' },
  'anacardos': { kcal: 553, prot: 18, carbs: 30, grasa: 44, label: 'Anacardos' },
  'pistachos': { kcal: 562, prot: 20, carbs: 28, grasa: 45, label: 'Pistachos' },
  'mantequilla cacahuete': { kcal: 588, prot: 25, carbs: 20, grasa: 50, label: 'Mantequilla de cacahuete' },
  'semillas chia': { kcal: 486, prot: 17, carbs: 42, grasa: 31, label: 'Semillas de chía' },
  'semillas lino': { kcal: 534, prot: 18, carbs: 29, grasa: 42, label: 'Semillas de lino' },
  'aceite de oliva': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'Aceite de oliva virgen' },
  'aceite': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'Aceite de oliva' },
  'aove': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'AOVE' },
  'mayonesa': { kcal: 680, prot: 1.1, carbs: 2.9, grasa: 75, label: 'Mayonesa' },
  'ketchup': { kcal: 112, prot: 1.4, carbs: 26, grasa: 0.1, label: 'Ketchup' },
  'mostaza': { kcal: 66, prot: 4, carbs: 5, grasa: 3, label: 'Mostaza' },
  'salsa de tomate': { kcal: 49, prot: 1.7, carbs: 10, grasa: 0.2, label: 'Salsa de tomate' },
  'miel': { kcal: 304, prot: 0.3, carbs: 82, grasa: 0, label: 'Miel' },
  'azucar': { kcal: 387, prot: 0, carbs: 100, grasa: 0, label: 'Azúcar' },
  'sal': { kcal: 0, prot: 0, carbs: 0, grasa: 0, label: 'Sal' },
  'whey': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Whey protein' },
  'proteina polvo': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Proteína en polvo' },
  'caseina': { kcal: 110, prot: 24, carbs: 3, grasa: 1, label: 'Caseína' },
  'creatina': { kcal: 0, prot: 0, carbs: 0, grasa: 0, label: 'Creatina' },
  'mcdonalds big mac': { kcal: 550, prot: 26, carbs: 46, grasa: 30, label: 'McDonald\'s Big Mac' },
  'big mac': { kcal: 550, prot: 26, carbs: 46, grasa: 30, label: 'McDonald\'s Big Mac' },
  'mcdonalds quarter pounder': { kcal: 520, prot: 30, carbs: 43, grasa: 26, label: 'McDonald\'s Quarter Pounder con queso' },
  'quarter pounder': { kcal: 520, prot: 30, carbs: 43, grasa: 26, label: 'McDonald\'s Quarter Pounder con queso' },
  'mcdonalds mcpollo': { kcal: 490, prot: 27, carbs: 54, grasa: 17, label: 'McDonald\'s McPollo' },
  'mcpollo': { kcal: 490, prot: 27, carbs: 54, grasa: 17, label: 'McDonald\'s McPollo' },
  'mcdonalds double big mac': { kcal: 740, prot: 42, carbs: 47, grasa: 43, label: 'McDonald\'s Double Big Mac' },
  'double big mac': { kcal: 740, prot: 42, carbs: 47, grasa: 43, label: 'McDonald\'s Double Big Mac' },
  'mcdonalds mcnuggets 6': { kcal: 274, prot: 17, carbs: 18, grasa: 15, label: 'McDonald\'s McNuggets 6 uds' },
  'mcnuggets 6': { kcal: 274, prot: 17, carbs: 18, grasa: 15, label: 'McDonald\'s McNuggets 6 uds' },
  'mcnuggets 9': { kcal: 411, prot: 26, carbs: 27, grasa: 22, label: 'McDonald\'s McNuggets 9 uds' },
  'mcnuggets 20': { kcal: 914, prot: 57, carbs: 59, grasa: 49, label: 'McDonald\'s McNuggets 20 uds' },
  'mcdonalds patatas medianas': { kcal: 330, prot: 4, carbs: 44, grasa: 16, label: 'McDonald\'s Patatas fritas medianas' },
  'patatas mcdonalds': { kcal: 330, prot: 4, carbs: 44, grasa: 16, label: 'McDonald\'s Patatas fritas' },
  'mcdonalds patatas grandes': { kcal: 440, prot: 5, carbs: 58, grasa: 21, label: 'McDonald\'s Patatas fritas grandes' },
  'mcdonalds mchappy': { kcal: 400, prot: 21, carbs: 41, grasa: 17, label: 'McDonald\'s McHappy' },
  'mcdonalds filet o fish': { kcal: 390, prot: 16, carbs: 41, grasa: 18, label: 'McDonald\'s Filet-O-Fish' },
  'filet o fish': { kcal: 390, prot: 16, carbs: 41, grasa: 18, label: 'McDonald\'s Filet-O-Fish' },
  'mcdonalds wrap': { kcal: 450, prot: 24, carbs: 47, grasa: 18, label: 'McDonald\'s Wrap de pollo' },
  'mcdonalds ensalada': { kcal: 100, prot: 8, carbs: 8, grasa: 3, label: 'McDonald\'s Ensalada' },
  'mcflurry oreo': { kcal: 340, prot: 8, carbs: 55, grasa: 10, label: 'McDonald\'s McFlurry Oreo' },
  'mcflurry': { kcal: 290, prot: 7, carbs: 48, grasa: 8, label: 'McDonald\'s McFlurry' },
  'mcdonalds sundae': { kcal: 220, prot: 4, carbs: 38, grasa: 6, label: 'McDonald\'s Sundae' },
  'whopper': { kcal: 657, prot: 28, carbs: 50, grasa: 40, label: 'Burger King Whopper' },
  'burger king whopper': { kcal: 657, prot: 28, carbs: 50, grasa: 40, label: 'Burger King Whopper' },
  'whopper junior': { kcal: 370, prot: 16, carbs: 32, grasa: 21, label: 'Burger King Whopper Junior' },
  'burger king crispy chicken': { kcal: 560, prot: 27, carbs: 55, grasa: 26, label: 'Burger King Crispy Chicken' },
  'burger king onion rings': { kcal: 410, prot: 5, carbs: 52, grasa: 21, label: 'Burger King Aros de cebolla' },
  'pizza margarita': { kcal: 250, prot: 10, carbs: 30, grasa: 10, label: 'Pizza margarita' },
  'pizza pepperoni': { kcal: 298, prot: 13, carbs: 29, grasa: 15, label: 'Pizza pepperoni' },
  'pizza carbonara': { kcal: 280, prot: 12, carbs: 28, grasa: 14, label: 'Pizza carbonara' },
  'pizza barbacoa': { kcal: 270, prot: 12, carbs: 31, grasa: 12, label: 'Pizza barbacoa' },
  'telepizza margarita': { kcal: 255, prot: 10, carbs: 31, grasa: 10, label: 'Telepizza Margarita' },
  'telepizza pepperoni': { kcal: 300, prot: 13, carbs: 30, grasa: 15, label: 'Telepizza Pepperoni' },
  'telepizza carbonara': { kcal: 285, prot: 12, carbs: 29, grasa: 14, label: 'Telepizza Carbonara' },
  'dominos margarita': { kcal: 248, prot: 10, carbs: 30, grasa: 10, label: 'Dominos Margarita' },
  'dominos pepperoni': { kcal: 295, prot: 13, carbs: 29, grasa: 14, label: 'Dominos Pepperoni' },
  'dominos barbacoa': { kcal: 268, prot: 12, carbs: 30, grasa: 12, label: 'Dominos Barbacoa' },
  'pizza base fina': { kcal: 240, prot: 10, carbs: 29, grasa: 10, label: 'Pizza base fina' },
  'pizza': { kcal: 266, prot: 11, carbs: 33, grasa: 10, label: 'Pizza' },
  'kebab': { kcal: 280, prot: 15, carbs: 25, grasa: 13, label: 'Kebab (pan+carne+salsas)' },
  'durum kebab': { kcal: 350, prot: 18, carbs: 35, grasa: 15, label: 'Dürüm kebab' },
  'lahmacun': { kcal: 220, prot: 10, carbs: 28, grasa: 8, label: 'Lahmacun' },
  'kebab pollo': { kcal: 250, prot: 16, carbs: 24, grasa: 10, label: 'Kebab de pollo' },
  'falafel': { kcal: 333, prot: 13, carbs: 32, grasa: 18, label: 'Falafel' },
  'shawarma': { kcal: 280, prot: 16, carbs: 22, grasa: 15, label: 'Shawarma' },
  'hummus': { kcal: 177, prot: 8, carbs: 20, grasa: 8, label: 'Hummus' },
  'hamburguesa': { kcal: 295, prot: 17, carbs: 24, grasa: 14, label: 'Hamburguesa' },
  'hamburguesa casera': { kcal: 350, prot: 22, carbs: 25, grasa: 18, label: 'Hamburguesa casera' },
  'hamburguesa doble': { kcal: 590, prot: 34, carbs: 48, grasa: 28, label: 'Hamburguesa doble' },
  'sushi': { kcal: 143, prot: 6, carbs: 28, grasa: 0.7, label: 'Sushi (pieza aprox 20g)' },
  'onigiri': { kcal: 170, prot: 4, carbs: 36, grasa: 0.5, label: 'Onigiri' },
  'ramen': { kcal: 140, prot: 8, carbs: 18, grasa: 4, label: 'Ramen' },
  'arroz frito': { kcal: 170, prot: 4, carbs: 26, grasa: 6, label: 'Arroz frito chino' },
  'rollito primavera': { kcal: 120, prot: 3, carbs: 14, grasa: 6, label: 'Rollito de primavera' },
  'tortilla de patatas': { kcal: 218, prot: 8, carbs: 18, grasa: 13, label: 'Tortilla de patatas' },
  'croquetas': { kcal: 220, prot: 8, carbs: 18, grasa: 13, label: 'Croquetas' },
  'patatas bravas': { kcal: 160, prot: 2.5, carbs: 22, grasa: 7, label: 'Patatas bravas' },
  'calamares romana': { kcal: 250, prot: 13, carbs: 22, grasa: 12, label: 'Calamares a la romana' },
  'bocadillo jamon': { kcal: 280, prot: 16, carbs: 30, grasa: 10, label: 'Bocadillo de jamón serrano' },
  'bocadillo tortilla': { kcal: 250, prot: 10, carbs: 30, grasa: 9, label: 'Bocadillo de tortilla' },
  'sandwich mixto': { kcal: 280, prot: 14, carbs: 28, grasa: 13, label: 'Sándwich mixto' },
  'empanada': { kcal: 280, prot: 8, carbs: 34, grasa: 13, label: 'Empanada' },
  'gazpacho': { kcal: 55, prot: 1.2, carbs: 8, grasa: 2.2, label: 'Gazpacho' },
  'paella': { kcal: 170, prot: 8, carbs: 28, grasa: 4, label: 'Paella' },
  'patatas fritas bolsa': { kcal: 536, prot: 7, carbs: 53, grasa: 35, label: 'Patatas fritas (Lay\'s/Ruffles)' },
  'lays': { kcal: 536, prot: 7, carbs: 53, grasa: 35, label: 'Lay\'s patatas fritas' },
  'ruffles': { kcal: 522, prot: 6, carbs: 54, grasa: 32, label: 'Ruffles' },
  'pringles': { kcal: 530, prot: 5, carbs: 55, grasa: 33, label: 'Pringles' },
  'doritos': { kcal: 490, prot: 7, carbs: 62, grasa: 24, label: 'Doritos' },
  'nachos': { kcal: 480, prot: 7, carbs: 61, grasa: 24, label: 'Nachos' },
  'palomitas': { kcal: 375, prot: 11, carbs: 74, grasa: 5, label: 'Palomitas' },
  'palomitas mantequilla': { kcal: 480, prot: 8, carbs: 55, grasa: 26, label: 'Palomitas con mantequilla' },
  'gusanitos': { kcal: 518, prot: 5, carbs: 64, grasa: 27, label: 'Gusanitos' },
  'pipas': { kcal: 582, prot: 21, carbs: 17, grasa: 50, label: 'Pipas de girasol' },
  'crackers': { kcal: 430, prot: 10, carbs: 68, grasa: 13, label: 'Crackers' },
  'kit kat': { kcal: 509, prot: 7, carbs: 62, grasa: 26, label: 'Kit Kat' },
  'twix': { kcal: 498, prot: 5, carbs: 65, grasa: 24, label: 'Twix' },
  'bounty': { kcal: 471, prot: 4, carbs: 59, grasa: 24, label: 'Bounty' },
  'snickers': { kcal: 488, prot: 9, carbs: 59, grasa: 25, label: 'Snickers' },
  'mars': { kcal: 449, prot: 5, carbs: 70, grasa: 17, label: 'Mars' },
  'milka': { kcal: 530, prot: 8, carbs: 58, grasa: 30, label: 'Milka' },
  'toblerone': { kcal: 540, prot: 7, carbs: 61, grasa: 30, label: 'Toblerone' },
  'kinder bueno': { kcal: 553, prot: 8, carbs: 56, grasa: 33, label: 'Kinder Bueno' },
  'kinder chocolate': { kcal: 539, prot: 9, carbs: 58, grasa: 31, label: 'Kinder Chocolate' },
  'nutella': { kcal: 539, prot: 6, carbs: 58, grasa: 31, label: 'Nutella' },
  'oreo': { kcal: 471, prot: 5, carbs: 67, grasa: 21, label: 'Oreo' },
  'donuts': { kcal: 390, prot: 6, carbs: 52, grasa: 18, label: 'Donuts Glazed' },
  'palmera chocolate': { kcal: 430, prot: 6, carbs: 60, grasa: 20, label: 'Palmera de chocolate' },
  'croissant': { kcal: 406, prot: 8, carbs: 46, grasa: 21, label: 'Croissant' },
  'napolitana chocolate': { kcal: 380, prot: 7, carbs: 52, grasa: 17, label: 'Napolitana de chocolate' },
  'magdalena': { kcal: 420, prot: 6, carbs: 55, grasa: 20, label: 'Magdalena' },
  'galletas maria': { kcal: 430, prot: 7, carbs: 75, grasa: 12, label: 'Galletas María' },
  'galletas digestive': { kcal: 471, prot: 7, carbs: 64, grasa: 22, label: 'Galletas Digestive' },
  'chocolate negro': { kcal: 546, prot: 5, carbs: 60, grasa: 31, label: 'Chocolate negro 70%' },
  'chocolate con leche': { kcal: 535, prot: 8, carbs: 58, grasa: 30, label: 'Chocolate con leche' },
  'chocolate blanco': { kcal: 539, prot: 6, carbs: 59, grasa: 32, label: 'Chocolate blanco' },
  'gominolas': { kcal: 330, prot: 6, carbs: 77, grasa: 0, label: 'Gominolas' },
  'haribo': { kcal: 330, prot: 6, carbs: 77, grasa: 0, label: 'Haribo' },
  'helado': { kcal: 207, prot: 3.5, carbs: 24, grasa: 11, label: 'Helado' },
  'helado magnum': { kcal: 280, prot: 4, carbs: 30, grasa: 17, label: 'Magnum Classic' },
  'helado cornetto': { kcal: 250, prot: 4, carbs: 33, grasa: 13, label: 'Cornetto' },
  'coca cola': { kcal: 42, prot: 0, carbs: 11, grasa: 0, label: 'Coca-Cola' },
  'pepsi': { kcal: 41, prot: 0, carbs: 11, grasa: 0, label: 'Pepsi' },
  'fanta naranja': { kcal: 45, prot: 0, carbs: 12, grasa: 0, label: 'Fanta naranja' },
  'sprite': { kcal: 40, prot: 0, carbs: 10, grasa: 0, label: 'Sprite' },
  'redbull': { kcal: 45, prot: 0, carbs: 11, grasa: 0, label: 'Red Bull' },
  'monster': { kcal: 44, prot: 0, carbs: 11, grasa: 0, label: 'Monster Energy' },
  'aquarius naranja': { kcal: 24, prot: 0, carbs: 6, grasa: 0, label: 'Aquarius naranja' },
  'isotonica': { kcal: 25, prot: 0, carbs: 6, grasa: 0, label: 'Bebida isotónica' },
  'zumo naranja': { kcal: 45, prot: 0.7, carbs: 10, grasa: 0.2, label: 'Zumo de naranja natural' },
  'zumo': { kcal: 42, prot: 0.5, carbs: 10, grasa: 0.1, label: 'Zumo de fruta' },
  'cerveza': { kcal: 43, prot: 0.5, carbs: 3.6, grasa: 0, label: 'Cerveza' },
  'cerveza sin alcohol': { kcal: 22, prot: 0.5, carbs: 4.5, grasa: 0, label: 'Cerveza sin alcohol' },
  'vino tinto': { kcal: 85, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Vino tinto' },
  'vino blanco': { kcal: 82, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Vino blanco' },
  'copa vino': { kcal: 85, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Copa de vino' },
  'whisky': { kcal: 250, prot: 0, carbs: 0, grasa: 0, label: 'Whisky' },
  'vodka': { kcal: 231, prot: 0, carbs: 0, grasa: 0, label: 'Vodka' },
  'leche de avena': { kcal: 48, prot: 1.3, carbs: 6.8, grasa: 1.4, label: 'Leche de avena' },
  'leche de almendras': { kcal: 24, prot: 1, carbs: 2.9, grasa: 1.1, label: 'Leche de almendras' },
  'leche de soja': { kcal: 54, prot: 3.6, carbs: 5.5, grasa: 1.8, label: 'Leche de soja' },
  'lasaña': { kcal: 160, prot: 8, carbs: 15, grasa: 8, label: 'Lasaña' },
  'canelones': { kcal: 150, prot: 8, carbs: 16, grasa: 7, label: 'Canelones' },
  'espaguetis boloñesa': { kcal: 180, prot: 9, carbs: 22, grasa: 7, label: 'Espaguetis a la boloñesa' },
  'pasta carbonara': { kcal: 260, prot: 10, carbs: 27, grasa: 13, label: 'Pasta carbonara' },
  'salsa barbacoa': { kcal: 165, prot: 1, carbs: 38, grasa: 0.5, label: 'Salsa barbacoa' },
  'salsa cesar': { kcal: 520, prot: 2, carbs: 5, grasa: 55, label: 'Salsa César' },
  'vinagreta': { kcal: 460, prot: 0, carbs: 3, grasa: 49, label: 'Vinagreta' },
  'tahini': { kcal: 595, prot: 17, carbs: 21, grasa: 54, label: 'Tahini' },
}

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function searchLocal(query: string): FoodResult | null {
  const q = normalize(query)
  // Exact match
  for (const [key, val] of Object.entries(REF)) {
    if (normalize(key) === q) {
      return { name: val.label, kcal: 0, prot: 0, carbs: 0, grasa: 0, source: 'Referencia', per100g: val }
    }
  }
  // Partial match
  for (const [key, val] of Object.entries(REF)) {
    const k = normalize(key)
    if (q.includes(k) || k.includes(q)) {
      return { name: val.label, kcal: 0, prot: 0, carbs: 0, grasa: 0, source: 'Referencia', per100g: val }
    }
  }
  return null
}

// ── Open Food Facts — called client-side, no server needed ──
async function searchOFF(query: string): Promise<Candidate[]> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=id,product_name,brands,nutriments&sort_by=unique_scans_n`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    const products = (data.products ?? []) as Array<{
      id?: string; _id?: string; product_name?: string; brands?: string; nutriments?: Record<string, number>
    }>
    return products
      .filter(p => {
        const n = p.nutriments ?? {}
        const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] ? n['energy_100g'] / 4.184 : 0)
        return p.product_name && kcal > 0
      })
      .map(p => ({
        id: `off:${p.id ?? p._id}`,
        name: p.product_name!,
        brand: p.brands ?? null,
        description: null,
        nutriments: p.nutriments,
      }))
  } catch { return [] }
}

function offResultToFoodResult(candidate: Candidate & { nutriments?: Record<string, number> }, grams: number): FoodResult | null {
  const n = candidate.nutriments ?? {}
  const kcal100 = n['energy-kcal_100g'] ?? (n['energy_100g'] ? Math.round(n['energy_100g'] / 4.184) : null)
  const prot100 = n['proteins_100g']
  const carbs100 = n['carbohydrates_100g']
  const fat100 = n['fat_100g']
  if (!kcal100) return null
  const f = grams / 100
  return {
    name: candidate.brand ? `${candidate.name} (${candidate.brand})` : candidate.name,
    kcal: Math.round(kcal100 * f),
    prot: Math.round((prot100 ?? 0) * f * 10) / 10,
    carbs: Math.round((carbs100 ?? 0) * f * 10) / 10,
    grasa: Math.round((fat100 ?? 0) * f * 10) / 10,
    source: 'Open Food Facts',
    per100g: {
      kcal: Math.round(kcal100),
      prot: Math.round((prot100 ?? 0) * 10) / 10,
      carbs: Math.round((carbs100 ?? 0) * 10) / 10,
      grasa: Math.round((fat100 ?? 0) * 10) / 10,
    }
  }
}

function applyGrams(r: FoodResult, grams: number): FoodResult {
  const f = grams / 100
  return {
    ...r,
    kcal: Math.round(r.per100g.kcal * f),
    prot: Math.round(r.per100g.prot * f * 10) / 10,
    carbs: Math.round(r.per100g.carbs * f * 10) / 10,
    grasa: Math.round(r.per100g.grasa * f * 10) / 10,
  }
}

export function FoodSearchModal({ onClose, onSave, initialNote = '' }: FoodSearchModalProps) {
  const [query, setQuery] = useState('')
  const [grams, setGrams] = useState('100')
  const [unit, setUnit] = useState<'g' | 'ml'>('g')
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<(Candidate & { nutriments?: Record<string, number> })[]>([])
  const [result, setResult] = useState<FoodResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const [manualProt, setManualProt] = useState('')
  const [items, setItems] = useState<FoodItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const total = items.reduce((acc, i) => ({ kcal: acc.kcal + i.kcal, prot: acc.prot + i.prot }), { kcal: 0, prot: 0 })
  const gramsNum = parseFloat(grams) || 100

  async function handleSearch() {
    const q = query.trim()
    if (!q) return
    setSearching(true)
    setResult(null)
    setCandidates([])
    setNotFound(false)

    // 1. Local reference (instant)
    const local = searchLocal(q)
    if (local) { setResult(applyGrams(local, gramsNum)); setSearching(false); return }

    // 2. Open Food Facts client-side
    const offResults = await searchOFF(q)
    if (offResults.length === 1) {
      const r = offResultToFoodResult(offResults[0], gramsNum)
      if (r) { setResult(r); setSearching(false); return }
    } else if (offResults.length > 1) {
      setCandidates(offResults)
      setSearching(false)
      return
    }

    setNotFound(true)
    setSearching(false)
  }

  function selectCandidate(c: Candidate & { nutriments?: Record<string, number> }) {
    const r = offResultToFoodResult(c, gramsNum)
    if (r) { setResult(r); setCandidates([]) }
  }

  function handleAddManual() {
    const kcal = parseFloat(manualKcal)
    if (!manualName.trim() || !kcal) return
    setItems(prev => [...prev, {
      name: manualName.trim(),
      grams: gramsNum,
      kcal: Math.round(kcal),
      prot: parseFloat(manualProt) || 0,
      carbs: 0,
      grasa: 0,
    }])
    setManualName('')
    setManualKcal('')
    setManualProt('')
    setShowManual(false)
    setNotFound(false)
    inputRef.current?.focus()
  }

  function handleAdd() {
    if (!result) return
    setItems(prev => [...prev, {
      name: result.name.length > 50 ? result.name.slice(0, 50) + '…' : result.name,
      grams: gramsNum,
      kcal: result.kcal,
      prot: result.prot,
      carbs: result.carbs,
      grasa: result.grasa,
    }])
    setResult(null)
    setQuery('')
    setGrams('100')
    setUnit('g')
    setNotFound(false)
    setCandidates([])
    inputRef.current?.focus()
  }

  const suggestions = query.length >= 2
    ? Object.values(REF).filter(v =>
        normalize(v.label).includes(normalize(query))
      ).slice(0, 5)
    : []

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Añadir alimento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Escribe el alimento y la cantidad</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Search row */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setResult(null); setCandidates([]); setNotFound(false) }}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Ej: pechuga de pollo, pizza..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
            {/* Amount + unit */}
            <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden shrink-0">
              <input
                value={grams}
                onChange={e => { setGrams(e.target.value.replace(/[^\d.]/g, '')); setResult(null) }}
                onFocus={e => e.target.select()}
                type="number"
                min="1"
                className="w-16 px-3 py-3 text-sm text-gray-900 dark:text-white bg-transparent border-none outline-none"
              />
              <div className="flex flex-col border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setUnit('g')}
                  className={`flex-1 px-2 text-xs font-medium transition-colors ${unit === 'g' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  g
                </button>
                <button
                  onClick={() => setUnit('ml')}
                  className={`flex-1 px-2 text-xs font-medium border-t border-gray-200 dark:border-gray-700 transition-colors ${unit === 'ml' ? 'bg-blue-600 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  ml
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && !result && candidates.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s.label} onClick={() => { setQuery(s.label); setResult(null); setNotFound(false) }}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                  {s.label}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSearch} disabled={searching || !query.trim() || !grams}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {searching ? <><RefreshCw size={15} className="animate-spin" />Buscando...</> : <><Search size={15} />Buscar</>}
          </button>

          {/* Candidates */}
          {candidates.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Selecciona el alimento:</p>
              {candidates.map(c => (
                <button key={c.id} onClick={() => selectCandidate(c)}
                  className="w-full flex items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-left transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{c.name}</p>
                    {c.brand && <p className="text-xs text-gray-400 mt-0.5">{c.brand}</p>}
                  </div>
                  <ChevronRight size={14} className="text-gray-400 shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* Not found */}
          {notFound && !showManual && (
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                    No encontrado. Prueba con otro nombre o en inglés.
                  </p>
                  <button onClick={() => setShowManual(true)}
                    className="text-xs font-medium text-amber-700 dark:text-amber-300 underline">
                    Añadir manualmente con kcal conocidas →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual entry */}
          {showManual && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Introducir manualmente</p>
              <input value={manualName} onChange={e => setManualName(e.target.value)}
                placeholder="Nombre del alimento"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Kcal</label>
                  <input value={manualKcal} onChange={e => setManualKcal(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="Ej: 450"
                    type="number" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Proteína (g)</label>
                  <input value={manualProt} onChange={e => setManualProt(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder="Ej: 25"
                    type="number" className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowManual(false)}
                  className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  Cancelar
                </button>
                <button onClick={handleAddManual} disabled={!manualName.trim() || !manualKcal}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  Añadir
                </button>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{grams}{unit} · vía {result.source}</p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {[
                  { label: 'Kcal', value: String(result.kcal), color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Prot', value: `${result.prot}g`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Carbs', value: `${result.carbs}g`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Grasa', value: `${result.grasa}g`, color: 'text-gray-500 dark:text-gray-400' },
                ].map(m => (
                  <div key={m.label} className="bg-white dark:bg-gray-800 rounded-lg py-2">
                    <p className={`text-sm font-semibold ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-gray-400">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-gray-400">Por 100{unit}: {result.per100g.kcal} kcal · {result.per100g.prot}g prot</p>
              <button onClick={handleAdd} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} />Añadir a la lista
              </button>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Alimentos añadidos</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.grams}g · {item.kcal} kcal · {item.prot}g prot</p>
                  </div>
                  <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Total</span>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-amber-600">{total.kcal} kcal</span>
                  <span className="text-xs font-semibold text-emerald-600">{total.prot}g prot</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 dark:border-gray-800 shrink-0 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancelar
          </button>
          <button onClick={() => onSave(items, total.kcal, total.prot, '')} disabled={items.length === 0}
            className="flex-1 py-3 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {items.length > 0 ? `Guardar (${total.kcal} kcal)` : 'Añade alimentos'}
          </button>
        </div>
      </div>
    </div>
  )
}
