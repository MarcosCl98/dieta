'use client'

interface TimelineItem {
  time: string
  label: string
  type: 'i' | 'ac' | 'wn'
}

const DOT_COLOR = {
  i: 'bg-blue-400 border-blue-400',
  ac: 'bg-emerald-400 border-emerald-400',
  wn: 'bg-amber-400 border-amber-400',
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  return (
    <div className="flex items-start overflow-x-auto pb-1 gap-0">
      {items.map((item, i) => (
        <div key={i} className="flex-1 min-w-[58px] flex flex-col items-center relative">
          <div className="flex items-center w-full relative">
            <div className={`w-3 h-3 rounded-full border-2 z-10 shrink-0 ${DOT_COLOR[item.type]}`} />
            {i < items.length - 1 && (
              <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            )}
          </div>
          <div className="text-center mt-1">
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.time}</div>
            <div className="text-[10px] text-gray-400 leading-tight mt-0.5 whitespace-pre-line">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
