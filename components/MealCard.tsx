import React from 'react'
'use client'

import { useState } from 'react'
import { Meal, Option } from '@/lib/data'
import { ChevronDown, ChevronUp, Check, Zap, Clock, Star } from 'lucide-react'

interface MealCardProps {
  meal: Meal
  selectedOptionId: string | null
  onSelect: (option: Option) => void
  onDeselect: () => void
  onCheatMeal?: () => void
}

const TYPE_CONFIG = {
  normal: { label: null, className: '' },
  rapida: { label: 'rápida', className: 'bg-red-50 text-red-500 dark:bg-red-900/30' },
  yogur: { label: 'yogur prot', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
  airfryer: { label: 'air fryer', className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30' },
  ocasional: { label: 'ocasional', className: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
}

const TAG_CONFIG: Record<string, string> = {
  'pre-entreno': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30',
  'post-entreno': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30',
  'pre-cardio': 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30',
  'post-cardio': 'bg-blue-50 text-blue-700 dark:bg-blue-900/30',
}

const NOTE_BORDER: Record<string, string> = {
  g: 'border-emerald-400',
  a: 'border-amber-400',
  i: 'border-blue-400',
  '': 'border-gray-200 dark:border-gray-700',
}

export function MealCard({ meal, selectedOptionId, onSelect, onDeselect, onCheatMeal }: MealCardProps) {
  const [open, setOpen] = useState(false)
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  // Auto-close when a selection is made
  const prevSelectedRef = React.useRef(selectedOptionId)
  React.useEffect(() => {
    if (selectedOptionId && !prevSelectedRef.current) {
      // Just got selected — close the card
      setOpen(false)
    }
    prevSelectedRef.current = selectedOptionId
  }, [selectedOptionId])

  const selectedOption = meal.options.find((o) => o.id === selectedOptionId)

  function formatName(name: string) {
    return name.replace(/\[opcional\]/g, '')
  }

  function hasOptional(name: string) {
    return name.includes('[opcional]')
  }

  return (
    <div className={`bg-white dark:bg-gray-900 border rounded-2xl overflow-hidden shadow-sm transition-all ${
      selectedOptionId ? 'border-emerald-200 dark:border-emerald-800 opacity-80' : 'border-gray-100 dark:border-gray-800'
    }`}>
      {/* Header */}
      <button
        className="w-full text-left px-4 py-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{meal.title}</span>
            {meal.tag && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_CONFIG[meal.tag] ?? ''}`}>
                {meal.tag}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{meal.time}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {selectedOption ? (
            <div className="flex items-center gap-1.5">
              <Check size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {selectedOption.kcal} kcal
              </span>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <span className="text-xs bg-amber-50 text-amber-600 dark:bg-amber-900/30 px-2 py-0.5 rounded-full font-medium">
                {meal.kcal} kcal
              </span>
              <span className="text-xs bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full font-medium">
                {meal.prot}g prot
              </span>
            </div>
          )}
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>

      {/* Selected preview when closed */}
      {!open && selectedOption && (
        <div className="px-4 pb-3 -mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            {formatName(selectedOption.name)}
          </p>
        </div>
      )}

      {/* Options list */}
      {open && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {/* Note */}
          <div className={`mx-4 my-3 text-xs text-gray-500 dark:text-gray-400 border-l-2 pl-3 py-1 ${NOTE_BORDER[meal.noteType ?? '']}`}>
            {meal.note}
          </div>

          <div className="pb-2">
            {meal.options.map((opt) => {
              const isSelected = opt.id === selectedOptionId
              const cfg = TYPE_CONFIG[opt.type]
              const nameClean = formatName(opt.name)
              const hasOpt = hasOptional(opt.name)

              return (
                <div key={opt.id} className={`mx-3 mb-1.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20'
                    : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 hover:border-gray-200 dark:hover:border-gray-700'
                }`}>
                  <button
                    className="w-full text-left p-3"
                    onClick={() => {
                      if (isSelected) onDeselect()
                      else onSelect(opt)
                      setExpandedRecipe(null)
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {isSelected && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                            {nameClean}
                          </span>
                          {cfg.label && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium shrink-0 ${cfg.className}`}>
                              {cfg.label}
                            </span>
                          )}
                          {hasOpt && (
                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md shrink-0">
                              verdura opcional
                            </span>
                          )}
                        </div>
                        {opt.comp && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">↳ {opt.comp}</p>
                        )}
                        <div className="flex gap-3 flex-wrap">
                          <span className="text-xs text-amber-600 font-medium">{opt.kcal} kcal</span>
                          <span className="text-xs text-emerald-600 font-medium">{opt.prot}g prot</span>
                          <span className="text-xs text-blue-500 font-medium">{opt.carbs}g carbs</span>
                          <span className="text-xs text-gray-400">{opt.grasa}g grasa</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Recipe toggle */}
                  {opt.recipe && (
                    <div className="px-3 pb-2">
                      <button
                        className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          setExpandedRecipe(expandedRecipe === opt.id ? null : opt.id)
                        }}
                      >
                        <Zap size={11} />
                        {expandedRecipe === opt.id ? 'Ocultar instrucciones' : 'Ver instrucciones'}
                      </button>
                      {expandedRecipe === opt.id && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed border-l-2 border-amber-300 pl-2">
                          {opt.recipe}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Cheat meal option */}
            {onCheatMeal && (
              <div className="mx-3 mb-2">
                <button
                  onClick={onCheatMeal}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-900/10 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <span className="text-xl shrink-0">🍕</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Cheat meal</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">Añade lo que comiste y calcula las kcal</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
