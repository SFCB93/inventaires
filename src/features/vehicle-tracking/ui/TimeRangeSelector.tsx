'use client'

import type { TimeRange } from '../domain/types'

interface TimeRangeSelectorProps {
  value: TimeRange
  onChange: (range: TimeRange) => void
}

const OPTIONS: { value: TimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '90d', label: '90 jours' },
]

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-1"
      role="group"
      aria-label="Échelle de temps"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          data-testid={`time-range-${option.value}`}
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
