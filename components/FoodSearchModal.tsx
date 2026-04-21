'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Search, RefreshCw, Plus, AlertCircle } from 'lucide-react'

interface FoodResult {
  name: string
  kcal: number
  prot: number
  carbs: number
  grasa: number
  unit: 'g' | 'ml'
  fixedPortion?: number
}

interface FoodItem {
  name: string
  amount: number
  unit: 'g' | 'ml'
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

// Porciones fijas — kcal ya calculadas para el tamaño indicado
const FIXED: Record<string, { kcal: number; prot: number; carbs: number; grasa: number; label: string; fixedGrams: number }> = {
  'big mac': { kcal: 550, prot: 26, carbs: 46, grasa: 30, label: 'McDonald\'s Big Mac', fixedGrams: 200 },
  'mcdonalds big mac': { kcal: 550, prot: 26, carbs: 46, grasa: 30, label: 'McDonald\'s Big Mac', fixedGrams: 200 },
  'quarter pounder': { kcal: 520, prot: 30, carbs: 43, grasa: 26, label: 'McDonald\'s Quarter Pounder con queso', fixedGrams: 198 },
  'mcpollo': { kcal: 490, prot: 27, carbs: 54, grasa: 17, label: 'McDonald\'s McPollo', fixedGrams: 187 },
  'double big mac': { kcal: 740, prot: 42, carbs: 47, grasa: 43, label: 'McDonald\'s Double Big Mac', fixedGrams: 268 },
  'mcnuggets 6': { kcal: 274, prot: 17, carbs: 18, grasa: 15, label: 'McDonald\'s McNuggets 6 uds', fixedGrams: 96 },
  'mcnuggets 9': { kcal: 411, prot: 26, carbs: 27, grasa: 22, label: 'McDonald\'s McNuggets 9 uds', fixedGrams: 144 },
  'mcnuggets 20': { kcal: 914, prot: 57, carbs: 59, grasa: 49, label: 'McDonald\'s McNuggets 20 uds', fixedGrams: 320 },
  'patatas mcdonalds medianas': { kcal: 330, prot: 4, carbs: 44, grasa: 16, label: 'McDonald\'s Patatas medianas', fixedGrams: 117 },
  'patatas mcdonalds grandes': { kcal: 440, prot: 5, carbs: 58, grasa: 21, label: 'McDonald\'s Patatas grandes', fixedGrams: 154 },
  'patatas mcdonalds pequeñas': { kcal: 220, prot: 3, carbs: 29, grasa: 11, label: 'McDonald\'s Patatas pequeñas', fixedGrams: 71 },
  'filet o fish': { kcal: 390, prot: 16, carbs: 41, grasa: 18, label: 'McDonald\'s Filet-O-Fish', fixedGrams: 141 },
  'mcflurry oreo': { kcal: 340, prot: 8, carbs: 55, grasa: 10, label: 'McDonald\'s McFlurry Oreo', fixedGrams: 280 },
  'mcflurry': { kcal: 290, prot: 7, carbs: 48, grasa: 8, label: 'McDonald\'s McFlurry', fixedGrams: 280 },
  'sundae mcdonalds': { kcal: 220, prot: 4, carbs: 38, grasa: 6, label: 'McDonald\'s Sundae', fixedGrams: 170 },
  'whopper': { kcal: 657, prot: 28, carbs: 50, grasa: 40, label: 'Burger King Whopper', fixedGrams: 270 },
  'whopper junior': { kcal: 370, prot: 16, carbs: 32, grasa: 21, label: 'Burger King Whopper Junior', fixedGrams: 145 },
  'crispy chicken bk': { kcal: 560, prot: 27, carbs: 55, grasa: 26, label: 'Burger King Crispy Chicken', fixedGrams: 230 },
  'telepizza margarita porcion': { kcal: 250, prot: 10, carbs: 31, grasa: 10, label: 'Telepizza Margarita (porción)', fixedGrams: 100 },
  'telepizza pepperoni porcion': { kcal: 295, prot: 13, carbs: 30, grasa: 14, label: 'Telepizza Pepperoni (porción)', fixedGrams: 100 },
  'telepizza carbonara porcion': { kcal: 280, prot: 12, carbs: 29, grasa: 13, label: 'Telepizza Carbonara (porción)', fixedGrams: 100 },
  'telepizza margarita entera': { kcal: 1500, prot: 60, carbs: 186, grasa: 60, label: 'Telepizza Margarita entera mediana', fixedGrams: 600 },
  'telepizza pepperoni entera': { kcal: 1770, prot: 78, carbs: 180, grasa: 84, label: 'Telepizza Pepperoni entera mediana', fixedGrams: 600 },
  'dominos margarita porcion': { kcal: 245, prot: 10, carbs: 30, grasa: 10, label: 'Dominos Margarita (porción)', fixedGrams: 100 },
  'dominos pepperoni porcion': { kcal: 290, prot: 13, carbs: 29, grasa: 13, label: 'Dominos Pepperoni (porción)', fixedGrams: 100 },
  'dominos barbacoa porcion': { kcal: 265, prot: 12, carbs: 30, grasa: 11, label: 'Dominos Barbacoa (porción)', fixedGrams: 100 },
  'kebab': { kcal: 550, prot: 28, carbs: 48, grasa: 25, label: 'Kebab completo', fixedGrams: 300 },
  'durum kebab': { kcal: 620, prot: 30, carbs: 65, grasa: 26, label: 'Dürüm kebab completo', fixedGrams: 320 },
  'lahmacun': { kcal: 330, prot: 15, carbs: 42, grasa: 12, label: 'Lahmacun (unidad)', fixedGrams: 150 },
  'kebab pollo': { kcal: 490, prot: 30, carbs: 46, grasa: 18, label: 'Kebab de pollo', fixedGrams: 280 },
  'shawarma': { kcal: 520, prot: 28, carbs: 45, grasa: 24, label: 'Shawarma completo', fixedGrams: 280 },
  'falafel racion': { kcal: 380, prot: 14, carbs: 38, grasa: 20, label: 'Falafel ración 5 uds', fixedGrams: 120 },
  'coca cola lata': { kcal: 139, prot: 0, carbs: 35, grasa: 0, label: 'Coca-Cola lata 330ml', fixedGrams: 330 },
  'coca cola botella': { kcal: 210, prot: 0, carbs: 53, grasa: 0, label: 'Coca-Cola botella 500ml', fixedGrams: 500 },
  'pepsi lata': { kcal: 136, prot: 0, carbs: 36, grasa: 0, label: 'Pepsi lata 330ml', fixedGrams: 330 },
  'fanta lata': { kcal: 149, prot: 0, carbs: 40, grasa: 0, label: 'Fanta Naranja lata 330ml', fixedGrams: 330 },
  'sprite lata': { kcal: 132, prot: 0, carbs: 33, grasa: 0, label: 'Sprite lata 330ml', fixedGrams: 330 },
  'redbull lata': { kcal: 114, prot: 1, carbs: 28, grasa: 0, label: 'Red Bull lata 250ml', fixedGrams: 250 },
  'monster lata': { kcal: 194, prot: 0, carbs: 48, grasa: 0, label: 'Monster Energy lata 500ml', fixedGrams: 500 },
  'aquarius': { kcal: 79, prot: 0, carbs: 20, grasa: 0, label: 'Aquarius 330ml', fixedGrams: 330 },
  'cerveza lata': { kcal: 130, prot: 1.5, carbs: 11, grasa: 0, label: 'Cerveza lata 330ml', fixedGrams: 330 },
  'cerveza botella': { kcal: 130, prot: 1.5, carbs: 11, grasa: 0, label: 'Cerveza botella 330ml', fixedGrams: 330 },
  'cerveza sin lata': { kcal: 66, prot: 1.5, carbs: 15, grasa: 0, label: 'Cerveza sin alcohol 330ml', fixedGrams: 330 },
  'copa vino tinto': { kcal: 119, prot: 0.1, carbs: 3.6, grasa: 0, label: 'Copa vino tinto 140ml', fixedGrams: 140 },
  'copa vino blanco': { kcal: 115, prot: 0.1, carbs: 3.6, grasa: 0, label: 'Copa vino blanco 140ml', fixedGrams: 140 },
  'cafe solo': { kcal: 2, prot: 0.3, carbs: 0, grasa: 0, label: 'Café solo', fixedGrams: 30 },
  'cafe con leche': { kcal: 55, prot: 3, carbs: 5.5, grasa: 2, label: 'Café con leche', fixedGrams: 150 },
  'cortado': { kcal: 20, prot: 1, carbs: 2, grasa: 0.8, label: 'Cortado', fixedGrams: 60 },
  'capuchino': { kcal: 90, prot: 5, carbs: 9, grasa: 3, label: 'Capuchino', fixedGrams: 180 },
  'cafe americano': { kcal: 5, prot: 0.3, carbs: 0.5, grasa: 0, label: 'Café americano', fixedGrams: 240 },
  'donuts glazed': { kcal: 255, prot: 4, carbs: 36, grasa: 11, label: 'Donuts Glazed (unidad)', fixedGrams: 65 },
  'croissant unidad': { kcal: 240, prot: 5, carbs: 27, grasa: 13, label: 'Croissant (unidad)', fixedGrams: 60 },
  'napolitana chocolate': { kcal: 300, prot: 6, carbs: 42, grasa: 13, label: 'Napolitana de chocolate', fixedGrams: 80 },
  'magdalena unidad': { kcal: 145, prot: 2, carbs: 21, grasa: 7, label: 'Magdalena (unidad)', fixedGrams: 35 },
  'kit kat': { kcal: 218, prot: 3, carbs: 27, grasa: 11, label: 'Kit Kat (2 barritas 43g)', fixedGrams: 43 },
  'twix': { kcal: 284, prot: 3, carbs: 38, grasa: 13, label: 'Twix (57g)', fixedGrams: 57 },
  'bounty': { kcal: 234, prot: 2, carbs: 30, grasa: 12, label: 'Bounty (57g)', fixedGrams: 57 },
  'snickers': { kcal: 270, prot: 5, carbs: 35, grasa: 13, label: 'Snickers (57g)', fixedGrams: 57 },
  'mars': { kcal: 228, prot: 2.5, carbs: 36, grasa: 9, label: 'Mars (51g)', fixedGrams: 51 },
  'kinder bueno': { kcal: 246, prot: 4, carbs: 25, grasa: 15, label: 'Kinder Bueno (2 barritas 43g)', fixedGrams: 43 },
  'kinder chocolate': { kcal: 115, prot: 2, carbs: 13, grasa: 7, label: 'Kinder Chocolate (2 barritas 21g)', fixedGrams: 21 },
  'lays pequeña': { kcal: 265, prot: 3.5, carbs: 26, grasa: 17, label: 'Lay\'s bolsa pequeña 50g', fixedGrams: 50 },
  'lays mediana': { kcal: 530, prot: 7, carbs: 53, grasa: 35, label: 'Lay\'s bolsa mediana 100g', fixedGrams: 100 },
  'ruffles pequeña': { kcal: 261, prot: 3, carbs: 27, grasa: 16, label: 'Ruffles bolsa pequeña 50g', fixedGrams: 50 },
  'pringles tubo': { kcal: 318, prot: 3, carbs: 33, grasa: 20, label: 'Pringles tubo 60g', fixedGrams: 60 },
  'doritos pequeña': { kcal: 245, prot: 3.5, carbs: 31, grasa: 12, label: 'Doritos bolsa pequeña 50g', fixedGrams: 50 },
  'gusanitos bolsa': { kcal: 155, prot: 1.5, carbs: 20, grasa: 8, label: 'Gusanitos bolsa 30g', fixedGrams: 30 },
}

// Alimentos pesables — valores por 100g o 100ml
const WEIGHTED: Record<string, { kcal: number; prot: number; carbs: number; grasa: number; label: string; unit: 'g' | 'ml' }> = {
  'pechuga de pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo', unit: 'g' },
  'pechuga pollo': { kcal: 165, prot: 31, carbs: 0, grasa: 3.6, label: 'Pechuga de pollo', unit: 'g' },
  'pollo asado': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo asado', unit: 'g' },
  'pollo': { kcal: 215, prot: 25, carbs: 0, grasa: 13, label: 'Pollo', unit: 'g' },
  'muslo pollo': { kcal: 209, prot: 24, carbs: 0, grasa: 13, label: 'Muslo de pollo', unit: 'g' },
  'pavo': { kcal: 135, prot: 29, carbs: 0, grasa: 1.5, label: 'Pechuga de pavo', unit: 'g' },
  'pechuga pavo': { kcal: 135, prot: 29, carbs: 0, grasa: 1.5, label: 'Pechuga de pavo', unit: 'g' },
  'ternera': { kcal: 250, prot: 26, carbs: 0, grasa: 17, label: 'Ternera', unit: 'g' },
  'solomillo': { kcal: 180, prot: 28, carbs: 0, grasa: 7, label: 'Solomillo', unit: 'g' },
  'carne picada': { kcal: 254, prot: 26, carbs: 0, grasa: 17, label: 'Carne picada', unit: 'g' },
  'cerdo': { kcal: 242, prot: 27, carbs: 0, grasa: 14, label: 'Cerdo', unit: 'g' },
  'cerdo iberico': { kcal: 280, prot: 25, carbs: 0, grasa: 20, label: 'Cerdo ibérico', unit: 'g' },
  'jamon serrano': { kcal: 241, prot: 30, carbs: 0, grasa: 13, label: 'Jamón serrano', unit: 'g' },
  'jamon iberico': { kcal: 375, prot: 28, carbs: 1, grasa: 30, label: 'Jamón ibérico', unit: 'g' },
  'jamon cocido': { kcal: 120, prot: 18, carbs: 1, grasa: 5, label: 'Jamón cocido', unit: 'g' },
  'pechuga pavo loncheada': { kcal: 105, prot: 21, carbs: 1, grasa: 1.5, label: 'Pechuga de pavo loncheada', unit: 'g' },
  'chorizo': { kcal: 455, prot: 24, carbs: 1.9, grasa: 40, label: 'Chorizo', unit: 'g' },
  'salchichon': { kcal: 432, prot: 26, carbs: 1, grasa: 37, label: 'Salchichón', unit: 'g' },
  'lomo embuchado': { kcal: 199, prot: 22, carbs: 0, grasa: 12, label: 'Lomo embuchado', unit: 'g' },
  'bacon': { kcal: 458, prot: 12, carbs: 0.7, grasa: 45, label: 'Bacon', unit: 'g' },
  'salchicha': { kcal: 330, prot: 12, carbs: 3, grasa: 30, label: 'Salchicha', unit: 'g' },
  'salchicha frankfurt': { kcal: 285, prot: 12, carbs: 3, grasa: 26, label: 'Salchicha frankfurt', unit: 'g' },
  'mortadela': { kcal: 285, prot: 14, carbs: 2, grasa: 25, label: 'Mortadela', unit: 'g' },
  'fuet': { kcal: 430, prot: 22, carbs: 2, grasa: 38, label: 'Fuet', unit: 'g' },
  'salmon': { kcal: 208, prot: 20, carbs: 0, grasa: 13, label: 'Salmón', unit: 'g' },
  'merluza': { kcal: 86, prot: 17, carbs: 0, grasa: 2, label: 'Merluza', unit: 'g' },
  'atun lata': { kcal: 116, prot: 25, carbs: 0, grasa: 1.5, label: 'Atún en lata', unit: 'g' },
  'atun': { kcal: 116, prot: 25, carbs: 0, grasa: 1.5, label: 'Atún', unit: 'g' },
  'bacalao': { kcal: 82, prot: 18, carbs: 0, grasa: 0.7, label: 'Bacalao', unit: 'g' },
  'dorada': { kcal: 96, prot: 18, carbs: 0, grasa: 3, label: 'Dorada', unit: 'g' },
  'lubina': { kcal: 98, prot: 19, carbs: 0, grasa: 2.5, label: 'Lubina', unit: 'g' },
  'sardinas': { kcal: 208, prot: 25, carbs: 0, grasa: 12, label: 'Sardinas', unit: 'g' },
  'gambas': { kcal: 99, prot: 24, carbs: 0, grasa: 0.5, label: 'Gambas', unit: 'g' },
  'langostinos': { kcal: 90, prot: 19, carbs: 0, grasa: 1, label: 'Langostinos', unit: 'g' },
  'calamar': { kcal: 92, prot: 16, carbs: 3, grasa: 1.5, label: 'Calamar', unit: 'g' },
  'pulpo': { kcal: 82, prot: 15, carbs: 2, grasa: 1, label: 'Pulpo', unit: 'g' },
  'huevo': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero', unit: 'g' },
  'huevo entero': { kcal: 155, prot: 13, carbs: 1.1, grasa: 11, label: 'Huevo entero', unit: 'g' },
  'clara de huevo': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo', unit: 'g' },
  'claras': { kcal: 52, prot: 11, carbs: 0.7, grasa: 0.2, label: 'Clara de huevo', unit: 'g' },
  'yema': { kcal: 322, prot: 16, carbs: 3.6, grasa: 27, label: 'Yema de huevo', unit: 'g' },
  'tortilla francesa': { kcal: 196, prot: 13, carbs: 1, grasa: 16, label: 'Tortilla francesa', unit: 'g' },
  'huevos revueltos': { kcal: 170, prot: 12, carbs: 1, grasa: 13, label: 'Huevos revueltos', unit: 'g' },
  'tostada pan blanco': { kcal: 265, prot: 9, carbs: 49, grasa: 3, label: 'Pan blanco tostado', unit: 'g' },
  'tostada pan integral': { kcal: 247, prot: 13, carbs: 41, grasa: 4, label: 'Pan integral tostado', unit: 'g' },
  'pan con tomate': { kcal: 200, prot: 5, carbs: 35, grasa: 5, label: 'Pan con tomate y aceite', unit: 'g' },
  'leche entera': { kcal: 61, prot: 3.2, carbs: 4.8, grasa: 3.3, label: 'Leche entera', unit: 'ml' },
  'leche semidesnatada': { kcal: 42, prot: 3.4, carbs: 4.8, grasa: 1, label: 'Leche semidesnatada', unit: 'ml' },
  'leche desnatada': { kcal: 35, prot: 3.4, carbs: 4.9, grasa: 0.2, label: 'Leche desnatada', unit: 'ml' },
  'leche proteica': { kcal: 40, prot: 5, carbs: 4.5, grasa: 0.5, label: 'Leche proteica desnatada', unit: 'ml' },
  'leche': { kcal: 42, prot: 3.4, carbs: 4.8, grasa: 1, label: 'Leche semidesnatada', unit: 'ml' },
  'leche de avena': { kcal: 48, prot: 1.3, carbs: 6.8, grasa: 1.4, label: 'Leche de avena', unit: 'ml' },
  'leche de almendras': { kcal: 24, prot: 1, carbs: 2.9, grasa: 1.1, label: 'Leche de almendras', unit: 'ml' },
  'leche de soja': { kcal: 54, prot: 3.6, carbs: 5.5, grasa: 1.8, label: 'Leche de soja', unit: 'ml' },
  'yogur natural': { kcal: 59, prot: 3.5, carbs: 4.7, grasa: 3.3, label: 'Yogur natural', unit: 'g' },
  'yogur desnatado': { kcal: 45, prot: 4.5, carbs: 6, grasa: 0.1, label: 'Yogur desnatado', unit: 'g' },
  'yogur griego': { kcal: 97, prot: 9, carbs: 3.6, grasa: 5, label: 'Yogur griego', unit: 'g' },
  'yogur griego 0': { kcal: 65, prot: 10, carbs: 4, grasa: 0.2, label: 'Yogur griego 0%', unit: 'g' },
  'skyr': { kcal: 63, prot: 11, carbs: 4, grasa: 0.2, label: 'Skyr natural', unit: 'g' },
  'yogur straciatella dia': { kcal: 45, prot: 10, carbs: 2.9, grasa: 0.3, label: 'Yogur straciatella Día proteína', unit: 'g' },
  'yogur proteico': { kcal: 45, prot: 10, carbs: 2.9, grasa: 0.3, label: 'Yogur proteico', unit: 'g' },
  'oikos danone': { kcal: 95, prot: 8, carbs: 6, grasa: 3.5, label: 'Oikos Danone', unit: 'g' },
  'danone activia': { kcal: 70, prot: 4, carbs: 9.5, grasa: 1.8, label: 'Danone Activia', unit: 'g' },
  'danone griego': { kcal: 110, prot: 7, carbs: 5, grasa: 6.5, label: 'Danone Griego', unit: 'g' },
  'queso manchego': { kcal: 392, prot: 27, carbs: 0.5, grasa: 32, label: 'Queso manchego', unit: 'g' },
  'queso fresco': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Queso fresco', unit: 'g' },
  'queso brie': { kcal: 334, prot: 20, carbs: 0.5, grasa: 28, label: 'Queso brie', unit: 'g' },
  'queso cheddar': { kcal: 403, prot: 25, carbs: 1.3, grasa: 33, label: 'Queso cheddar', unit: 'g' },
  'queso': { kcal: 402, prot: 25, carbs: 1.3, grasa: 33, label: 'Queso', unit: 'g' },
  'mozzarella': { kcal: 280, prot: 28, carbs: 2.2, grasa: 17, label: 'Mozzarella', unit: 'g' },
  'mozzarella light': { kcal: 170, prot: 24, carbs: 2, grasa: 7, label: 'Mozzarella light', unit: 'g' },
  'requesón': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Requesón', unit: 'g' },
  'cottage': { kcal: 98, prot: 11, carbs: 3.4, grasa: 4, label: 'Cottage cheese', unit: 'g' },
  'mantequilla': { kcal: 717, prot: 0.9, carbs: 0.1, grasa: 81, label: 'Mantequilla', unit: 'g' },
  'avena': { kcal: 389, prot: 17, carbs: 66, grasa: 7, label: 'Avena', unit: 'g' },
  'copos de avena': { kcal: 389, prot: 17, carbs: 66, grasa: 7, label: 'Copos de avena', unit: 'g' },
  'arroz cocido': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz cocido', unit: 'g' },
  'arroz blanco': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz blanco cocido', unit: 'g' },
  'arroz': { kcal: 130, prot: 2.7, carbs: 28, grasa: 0.3, label: 'Arroz cocido', unit: 'g' },
  'arroz crudo': { kcal: 365, prot: 7, carbs: 79, grasa: 0.7, label: 'Arroz crudo', unit: 'g' },
  'arroz integral': { kcal: 123, prot: 2.7, carbs: 25, grasa: 1, label: 'Arroz integral cocido', unit: 'g' },
  'pasta cocida': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Pasta cocida', unit: 'g' },
  'pasta': { kcal: 131, prot: 5, carbs: 25, grasa: 1.1, label: 'Pasta cocida', unit: 'g' },
  'pasta integral': { kcal: 124, prot: 5.3, carbs: 23, grasa: 1.2, label: 'Pasta integral cocida', unit: 'g' },
  'pasta cruda': { kcal: 371, prot: 13, carbs: 74, grasa: 1.5, label: 'Pasta cruda', unit: 'g' },
  'gnocchi': { kcal: 130, prot: 3, carbs: 27, grasa: 0.5, label: 'Gnocchi', unit: 'g' },
  'quinoa': { kcal: 120, prot: 4.4, carbs: 22, grasa: 1.9, label: 'Quinoa cocida', unit: 'g' },
  'pan blanco': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan blanco', unit: 'g' },
  'pan integral': { kcal: 247, prot: 13, carbs: 41, grasa: 4, label: 'Pan integral', unit: 'g' },
  'pan': { kcal: 265, prot: 9, carbs: 49, grasa: 3.2, label: 'Pan', unit: 'g' },
  'pan de molde': { kcal: 265, prot: 8, carbs: 49, grasa: 4, label: 'Pan de molde', unit: 'g' },
  'baguette': { kcal: 270, prot: 9, carbs: 53, grasa: 2, label: 'Baguette', unit: 'g' },
  'galletas maria': { kcal: 430, prot: 7, carbs: 75, grasa: 12, label: 'Galletas María', unit: 'g' },
  'galletas digestive': { kcal: 471, prot: 7, carbs: 64, grasa: 22, label: 'Galletas Digestive', unit: 'g' },
  'corn flakes': { kcal: 357, prot: 7.5, carbs: 84, grasa: 0.5, label: 'Corn flakes', unit: 'g' },
  'granola': { kcal: 471, prot: 10, carbs: 57, grasa: 21, label: 'Granola', unit: 'g' },
  'muesli': { kcal: 360, prot: 9, carbs: 65, grasa: 7, label: 'Muesli', unit: 'g' },
  'lentejas': { kcal: 116, prot: 9, carbs: 20, grasa: 0.4, label: 'Lentejas cocidas', unit: 'g' },
  'garbanzos': { kcal: 164, prot: 9, carbs: 27, grasa: 2.6, label: 'Garbanzos cocidos', unit: 'g' },
  'alubias': { kcal: 127, prot: 9, carbs: 23, grasa: 0.5, label: 'Alubias cocidas', unit: 'g' },
  'edamame': { kcal: 122, prot: 11, carbs: 10, grasa: 5, label: 'Edamame', unit: 'g' },
  'patata': { kcal: 77, prot: 2, carbs: 17, grasa: 0.1, label: 'Patata cocida', unit: 'g' },
  'boniato': { kcal: 86, prot: 1.6, carbs: 20, grasa: 0.1, label: 'Boniato cocido', unit: 'g' },
  'brocoli': { kcal: 34, prot: 2.8, carbs: 7, grasa: 0.4, label: 'Brócoli', unit: 'g' },
  'espinacas': { kcal: 23, prot: 2.9, carbs: 3.6, grasa: 0.4, label: 'Espinacas', unit: 'g' },
  'tomate': { kcal: 18, prot: 0.9, carbs: 3.9, grasa: 0.2, label: 'Tomate', unit: 'g' },
  'lechuga': { kcal: 15, prot: 1.4, carbs: 2.9, grasa: 0.2, label: 'Lechuga', unit: 'g' },
  'pepino': { kcal: 16, prot: 0.7, carbs: 3.6, grasa: 0.1, label: 'Pepino', unit: 'g' },
  'zanahoria': { kcal: 41, prot: 0.9, carbs: 10, grasa: 0.2, label: 'Zanahoria', unit: 'g' },
  'cebolla': { kcal: 40, prot: 1.1, carbs: 9.3, grasa: 0.1, label: 'Cebolla', unit: 'g' },
  'pimiento': { kcal: 31, prot: 1, carbs: 6, grasa: 0.3, label: 'Pimiento', unit: 'g' },
  'champiñones': { kcal: 22, prot: 3.1, carbs: 3.3, grasa: 0.3, label: 'Champiñones', unit: 'g' },
  'esparragos': { kcal: 20, prot: 2.2, carbs: 3.7, grasa: 0.1, label: 'Espárragos', unit: 'g' },
  'judias verdes': { kcal: 31, prot: 1.8, carbs: 7, grasa: 0.1, label: 'Judías verdes', unit: 'g' },
  'calabacin': { kcal: 17, prot: 1.2, carbs: 3.1, grasa: 0.3, label: 'Calabacín', unit: 'g' },
  'berenjena': { kcal: 25, prot: 1, carbs: 6, grasa: 0.2, label: 'Berenjena', unit: 'g' },
  'coliflor': { kcal: 25, prot: 1.9, carbs: 5, grasa: 0.3, label: 'Coliflor', unit: 'g' },
  'aguacate': { kcal: 160, prot: 2, carbs: 9, grasa: 15, label: 'Aguacate', unit: 'g' },
  'platano': { kcal: 89, prot: 1.1, carbs: 23, grasa: 0.3, label: 'Plátano', unit: 'g' },
  'manzana': { kcal: 52, prot: 0.3, carbs: 14, grasa: 0.2, label: 'Manzana', unit: 'g' },
  'naranja': { kcal: 47, prot: 0.9, carbs: 12, grasa: 0.1, label: 'Naranja', unit: 'g' },
  'mandarina': { kcal: 53, prot: 0.8, carbs: 13, grasa: 0.3, label: 'Mandarina', unit: 'g' },
  'kiwi': { kcal: 61, prot: 1.1, carbs: 15, grasa: 0.5, label: 'Kiwi', unit: 'g' },
  'fresas': { kcal: 32, prot: 0.7, carbs: 8, grasa: 0.3, label: 'Fresas', unit: 'g' },
  'arandanos': { kcal: 57, prot: 0.7, carbs: 14, grasa: 0.3, label: 'Arándanos', unit: 'g' },
  'melocoton': { kcal: 39, prot: 0.9, carbs: 10, grasa: 0.3, label: 'Melocotón', unit: 'g' },
  'pera': { kcal: 57, prot: 0.4, carbs: 15, grasa: 0.1, label: 'Pera', unit: 'g' },
  'uvas': { kcal: 69, prot: 0.6, carbs: 18, grasa: 0.2, label: 'Uvas', unit: 'g' },
  'sandia': { kcal: 30, prot: 0.6, carbs: 8, grasa: 0.2, label: 'Sandía', unit: 'g' },
  'melon': { kcal: 34, prot: 0.8, carbs: 8, grasa: 0.2, label: 'Melón', unit: 'g' },
  'pina': { kcal: 50, prot: 0.5, carbs: 13, grasa: 0.1, label: 'Piña', unit: 'g' },
  'mango': { kcal: 60, prot: 0.8, carbs: 15, grasa: 0.4, label: 'Mango', unit: 'g' },
  'cerezas': { kcal: 63, prot: 1.1, carbs: 16, grasa: 0.2, label: 'Cerezas', unit: 'g' },
  'frambuesas': { kcal: 52, prot: 1.2, carbs: 12, grasa: 0.7, label: 'Frambuesas', unit: 'g' },
  'datiles': { kcal: 282, prot: 2.5, carbs: 75, grasa: 0.4, label: 'Dátiles', unit: 'g' },
  'pomelo': { kcal: 42, prot: 0.8, carbs: 11, grasa: 0.1, label: 'Pomelo', unit: 'g' },
  'almendras': { kcal: 579, prot: 21, carbs: 22, grasa: 50, label: 'Almendras', unit: 'g' },
  'nueces': { kcal: 654, prot: 15, carbs: 14, grasa: 65, label: 'Nueces', unit: 'g' },
  'cacahuetes': { kcal: 567, prot: 26, carbs: 16, grasa: 49, label: 'Cacahuetes', unit: 'g' },
  'anacardos': { kcal: 553, prot: 18, carbs: 30, grasa: 44, label: 'Anacardos', unit: 'g' },
  'pistachos': { kcal: 562, prot: 20, carbs: 28, grasa: 45, label: 'Pistachos', unit: 'g' },
  'mantequilla cacahuete': { kcal: 588, prot: 25, carbs: 20, grasa: 50, label: 'Mantequilla de cacahuete', unit: 'g' },
  'semillas chia': { kcal: 486, prot: 17, carbs: 42, grasa: 31, label: 'Semillas de chía', unit: 'g' },
  'aceite de oliva': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'Aceite de oliva', unit: 'ml' },
  'aceite': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'Aceite de oliva', unit: 'ml' },
  'aove': { kcal: 884, prot: 0, carbs: 0, grasa: 100, label: 'AOVE', unit: 'ml' },
  'mayonesa': { kcal: 680, prot: 1.1, carbs: 2.9, grasa: 75, label: 'Mayonesa', unit: 'g' },
  'ketchup': { kcal: 112, prot: 1.4, carbs: 26, grasa: 0.1, label: 'Ketchup', unit: 'g' },
  'mostaza': { kcal: 66, prot: 4, carbs: 5, grasa: 3, label: 'Mostaza', unit: 'g' },
  'salsa de tomate': { kcal: 49, prot: 1.7, carbs: 10, grasa: 0.2, label: 'Salsa de tomate', unit: 'g' },
  'salsa barbacoa': { kcal: 165, prot: 1, carbs: 38, grasa: 0.5, label: 'Salsa barbacoa', unit: 'g' },
  'hummus': { kcal: 177, prot: 8, carbs: 20, grasa: 8, label: 'Hummus', unit: 'g' },
  'miel': { kcal: 304, prot: 0.3, carbs: 82, grasa: 0, label: 'Miel', unit: 'g' },
  'azucar': { kcal: 387, prot: 0, carbs: 100, grasa: 0, label: 'Azúcar', unit: 'g' },
  'whey': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Whey protein', unit: 'g' },
  'proteina polvo': { kcal: 120, prot: 24, carbs: 4, grasa: 2, label: 'Proteína en polvo', unit: 'g' },
  'chocolate negro': { kcal: 546, prot: 5, carbs: 60, grasa: 31, label: 'Chocolate negro 70%', unit: 'g' },
  'chocolate con leche': { kcal: 535, prot: 8, carbs: 58, grasa: 30, label: 'Chocolate con leche', unit: 'g' },
  'chocolate blanco': { kcal: 539, prot: 6, carbs: 59, grasa: 32, label: 'Chocolate blanco', unit: 'g' },
  'nutella': { kcal: 539, prot: 6, carbs: 58, grasa: 31, label: 'Nutella', unit: 'g' },
  'milka': { kcal: 530, prot: 8, carbs: 58, grasa: 30, label: 'Milka', unit: 'g' },
  'helado': { kcal: 207, prot: 3.5, carbs: 24, grasa: 11, label: 'Helado', unit: 'g' },
  'oreo': { kcal: 471, prot: 5, carbs: 67, grasa: 21, label: 'Oreo', unit: 'g' },
  'coca cola': { kcal: 42, prot: 0, carbs: 11, grasa: 0, label: 'Coca-Cola', unit: 'ml' },
  'pepsi': { kcal: 41, prot: 0, carbs: 11, grasa: 0, label: 'Pepsi', unit: 'ml' },
  'fanta naranja': { kcal: 45, prot: 0, carbs: 12, grasa: 0, label: 'Fanta naranja', unit: 'ml' },
  'sprite': { kcal: 40, prot: 0, carbs: 10, grasa: 0, label: 'Sprite', unit: 'ml' },
  'redbull': { kcal: 45, prot: 0, carbs: 11, grasa: 0, label: 'Red Bull', unit: 'ml' },
  'monster': { kcal: 44, prot: 0, carbs: 11, grasa: 0, label: 'Monster Energy', unit: 'ml' },
  'cerveza': { kcal: 43, prot: 0.5, carbs: 3.6, grasa: 0, label: 'Cerveza', unit: 'ml' },
  'vino tinto': { kcal: 85, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Vino tinto', unit: 'ml' },
  'vino blanco': { kcal: 82, prot: 0.1, carbs: 2.6, grasa: 0, label: 'Vino blanco', unit: 'ml' },
  'zumo naranja': { kcal: 45, prot: 0.7, carbs: 10, grasa: 0.2, label: 'Zumo de naranja', unit: 'ml' },
  'zumo': { kcal: 42, prot: 0.5, carbs: 10, grasa: 0.1, label: 'Zumo de fruta', unit: 'ml' },
  'agua': { kcal: 0, prot: 0, carbs: 0, grasa: 0, label: 'Agua', unit: 'ml' },
  'patatas fritas': { kcal: 536, prot: 7, carbs: 53, grasa: 35, label: 'Patatas fritas', unit: 'g' },
  'lays': { kcal: 536, prot: 7, carbs: 53, grasa: 35, label: 'Lay\'s', unit: 'g' },
  'ruffles': { kcal: 522, prot: 6, carbs: 54, grasa: 32, label: 'Ruffles', unit: 'g' },
  'pringles': { kcal: 530, prot: 5, carbs: 55, grasa: 33, label: 'Pringles', unit: 'g' },
  'doritos': { kcal: 490, prot: 7, carbs: 62, grasa: 24, label: 'Doritos', unit: 'g' },
  'pipas': { kcal: 582, prot: 21, carbs: 17, grasa: 50, label: 'Pipas de girasol', unit: 'g' },
  'gusanitos': { kcal: 518, prot: 5, carbs: 64, grasa: 27, label: 'Gusanitos', unit: 'g' },
  'tortilla de patatas': { kcal: 218, prot: 8, carbs: 18, grasa: 13, label: 'Tortilla de patatas', unit: 'g' },
  'croquetas': { kcal: 220, prot: 8, carbs: 18, grasa: 13, label: 'Croquetas', unit: 'g' },
  'patatas bravas': { kcal: 160, prot: 2.5, carbs: 22, grasa: 7, label: 'Patatas bravas', unit: 'g' },
  'paella': { kcal: 170, prot: 8, carbs: 28, grasa: 4, label: 'Paella', unit: 'g' },
  'gazpacho': { kcal: 55, prot: 1.2, carbs: 8, grasa: 2.2, label: 'Gazpacho', unit: 'ml' },
  'lasaña': { kcal: 160, prot: 8, carbs: 15, grasa: 8, label: 'Lasaña', unit: 'g' },
  'pasta carbonara': { kcal: 260, prot: 10, carbs: 27, grasa: 13, label: 'Pasta carbonara', unit: 'g' },
  'espaguetis boloñesa': { kcal: 180, prot: 9, carbs: 22, grasa: 7, label: 'Espaguetis boloñesa', unit: 'g' },
  'hamburguesa': { kcal: 295, prot: 17, carbs: 24, grasa: 14, label: 'Hamburguesa', unit: 'g' },
  'pizza': { kcal: 266, prot: 11, carbs: 33, grasa: 10, label: 'Pizza', unit: 'g' },
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
}

function searchFood(query: string, amount: number): FoodResult | null {
  const q = norm(query)

  // Fixed: match by key OR by label
  for (const [k, v] of Object.entries(FIXED)) {
    if (norm(k) === q || norm(v.label) === q)
      return { name: v.label, kcal: v.kcal, prot: v.prot, carbs: v.carbs, grasa: v.grasa, unit: 'g', fixedPortion: v.fixedGrams }
  }
  for (const [k, v] of Object.entries(FIXED)) {
    const nk = norm(k)
    const nl = norm(v.label)
    if (q.includes(nk) || nk.includes(q) || q.includes(nl) || nl.includes(q))
      return { name: v.label, kcal: v.kcal, prot: v.prot, carbs: v.carbs, grasa: v.grasa, unit: 'g', fixedPortion: v.fixedGrams }
  }

  // Weighted: match by key OR by label
  for (const [k, v] of Object.entries(WEIGHTED)) {
    if (norm(k) === q || norm(v.label) === q) {
      const f = amount / 100
      return { name: v.label, kcal: Math.round(v.kcal * f), prot: Math.round(v.prot * f * 10) / 10, carbs: Math.round(v.carbs * f * 10) / 10, grasa: Math.round(v.grasa * f * 10) / 10, unit: v.unit }
    }
  }
  for (const [k, v] of Object.entries(WEIGHTED)) {
    const nk = norm(k)
    const nl = norm(v.label)
    if (q.includes(nk) || nk.includes(q) || q.includes(nl) || nl.includes(q)) {
      const f = amount / 100
      return { name: v.label, kcal: Math.round(v.kcal * f), prot: Math.round(v.prot * f * 10) / 10, carbs: Math.round(v.carbs * f * 10) / 10, grasa: Math.round(v.grasa * f * 10) / 10, unit: v.unit }
    }
  }
  return null
}

function getDefaultUnit(query: string): 'g' | 'ml' {
  const q = norm(query)
  for (const [k, v] of Object.entries(WEIGHTED)) {
    if (norm(k) === q || norm(k).includes(q) || q.includes(norm(k))) return v.unit
  }
  return 'g'
}

function getSuggestions(query: string): string[] {
  if (query.length < 2) return []
  const q = norm(query)
  const out: string[] = []
  for (const v of Object.values(FIXED)) { if (norm(v.label).includes(q)) out.push(v.label) }
  for (const v of Object.values(WEIGHTED)) { if (norm(v.label).includes(q) && !out.includes(v.label)) out.push(v.label) }
  return out.slice(0, 5)
}

export function FoodSearchModal({ onClose, onSave }: FoodSearchModalProps) {
  const [query, setQuery] = useState('')
  const [amount, setAmount] = useState('100')
  const [unit, setUnit] = useState<'g' | 'ml'>('g')
  const [result, setResult] = useState<FoodResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualKcal, setManualKcal] = useState('')
  const [manualProt, setManualProt] = useState('')
  const [items, setItems] = useState<FoodItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  // Recalculate weighted result when amount changes
  useEffect(() => {
    if (!result || result.fixedPortion) return
    const r = searchFood(query, amountNum)
    if (r && !r.fixedPortion) setResult(r)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount])

  const total = items.reduce((acc, i) => ({ kcal: acc.kcal + i.kcal, prot: acc.prot + i.prot }), { kcal: 0, prot: 0 })
  const amountNum = parseFloat(amount) || 100
  const suggestions = getSuggestions(query)

  function handleSearch() {
    const q = query.trim()
    if (!q) return
    setResult(null)
    setNotFound(false)
    setShowManual(false)
    const r = searchFood(q, amountNum)
    if (r) {
      setUnit(r.unit)
      setResult(r)
      if (r.fixedPortion) setAmount(String(r.fixedPortion))
    } else {
      setNotFound(true)
    }
  }

  function handleAdd() {
    if (!result) return
    setItems(prev => [...prev, {
      name: result.name.length > 50 ? result.name.slice(0, 50) + '…' : result.name,
      amount: result.fixedPortion ?? amountNum,
      unit,
      kcal: result.kcal,
      prot: result.prot,
      carbs: result.carbs,
      grasa: result.grasa,
    }])
    setResult(null)
    setQuery('')
    setAmount('100')
    setUnit('g')
    setNotFound(false)
    inputRef.current?.focus()
  }

  function handleAddManual() {
    const kcal = parseFloat(manualKcal)
    if (!manualName.trim() || !kcal) return
    setItems(prev => [...prev, { name: manualName.trim(), amount: amountNum, unit, kcal: Math.round(kcal), prot: parseFloat(manualProt) || 0, carbs: 0, grasa: 0 }])
    setManualName(''); setManualKcal(''); setManualProt('')
    setShowManual(false); setNotFound(false)
    inputRef.current?.focus()
  }

  function handleQueryChange(val: string) {
    setQuery(val)
    setResult(null)
    setNotFound(false)
    // Auto-detect unit from query
    const u = getDefaultUnit(val)
    setUnit(u)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Añadir alimento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Escribe el alimento para ver sus calorías</p>
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
              onChange={e => handleQueryChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
              placeholder="Ej: pechuga de pollo, Big Mac..."
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
            />
          </div>

          {/* Amount input — hidden when result is a fixed portion */}
          {!result?.fixedPortion && (
            <div className="flex items-center gap-2">
              <input
                value={amount}
                onChange={e => { setAmount(e.target.value.replace(/[^\d.]/g, '')); setResult(null) }}
                onFocus={e => e.target.select()}
                type="number" min="1"
                placeholder="100"
                className="w-28 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-3 text-sm text-gray-900 dark:text-white"
              />
              <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <button onClick={() => setUnit('g')} className={`px-4 py-3 text-sm font-medium transition-colors ${unit === 'g' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>g</button>
                <button onClick={() => setUnit('ml')} className={`px-4 py-3 text-sm font-medium border-l border-gray-200 dark:border-gray-700 transition-colors ${unit === 'ml' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>ml</button>
              </div>
              <p className="text-xs text-gray-400">cantidad</p>
            </div>
          )}
          {result?.fixedPortion && (
            <p className="text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
              Porción estándar: <span className="font-medium text-gray-600 dark:text-gray-300">{result.fixedPortion}{result.unit}</span> — las kcal ya están calculadas
            </p>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && !result && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map(s => (
                <button key={s} onClick={() => {
                  setQuery(s)
                  // Search immediately on suggestion tap
                  const r = searchFood(s, amountNum)
                  if (r) {
                    setUnit(r.unit)
                    setResult(r)
                    if (r.fixedPortion) setAmount(String(r.fixedPortion))
                    setNotFound(false)
                  } else {
                    handleQueryChange(s)
                  }
                }}
                  className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}

          <button onClick={handleSearch} disabled={!query.trim()}
            className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            <Search size={15} />Buscar
          </button>

          {/* Not found */}
          {notFound && !showManual && (
            <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                <p className="text-xs text-amber-700 dark:text-amber-300">No encontrado. Prueba con otro nombre.</p>
                <button onClick={() => setShowManual(true)} className="text-xs font-medium text-amber-700 dark:text-amber-300 underline">
                  Añadir manualmente →
                </button>
              </div>
            </div>
          )}

          {/* Manual entry */}
          {showManual && (
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-300">Introducir manualmente</p>
              <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Nombre del alimento"
                className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Kcal totales</label>
                  <input value={manualKcal} onChange={e => setManualKcal(e.target.value)} type="number" placeholder="450"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Proteína (g)</label>
                  <input value={manualProt} onChange={e => setManualProt(e.target.value)} type="number" placeholder="25"
                    className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-white" />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowManual(false)} className="flex-1 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs text-gray-500">Cancelar</button>
                <button onClick={handleAddManual} disabled={!manualName.trim() || !manualKcal}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-medium disabled:opacity-50">Añadir</button>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{result.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {result.fixedPortion ? `Porción: ${result.fixedPortion}${result.unit}` : `${amount}${unit}`}
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                {([
                  { label: 'Kcal', value: String(result.kcal), color: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Prot', value: `${result.prot}g`, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Carbs', value: `${result.carbs}g`, color: 'text-blue-600 dark:text-blue-400' },
                  { label: 'Grasa', value: `${result.grasa}g`, color: 'text-gray-500 dark:text-gray-400' },
                ] as { label: string; value: string; color: string }[]).map(m => (
                  <div key={m.label} className="bg-white dark:bg-gray-800 rounded-lg py-2">
                    <p className={`text-sm font-semibold ${m.color}`}>{m.value}</p>
                    <p className="text-[10px] text-gray-400">{m.label}</p>
                  </div>
                ))}
              </div>
              {!result.fixedPortion && (
                <p className="text-[11px] text-gray-400">Ajusta la cantidad arriba para recalcular</p>
              )}
              <button onClick={handleAdd} className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2">
                <Plus size={15} />Añadir a la lista
              </button>
            </div>
          )}

          {/* Items list */}
          {items.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Añadidos</p>
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.amount}{item.unit} · {item.kcal} kcal · {item.prot}g prot</p>
                  </div>
                  <button onClick={() => setItems(p => p.filter((_, i) => i !== idx))}
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
