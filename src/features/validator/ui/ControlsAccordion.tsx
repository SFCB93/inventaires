'use client'

import { useState } from 'react'
import type { PublicControlSummary } from '../domain/types'

function formatDate(date: Date): string {
  return (
    date.toLocaleDateString('fr-FR') +
    ' à ' +
    date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  )
}

function formatExpiryDate(date: string): string {
  const [year, month] = date.split('-')
  return new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(parseInt(year), parseInt(month) - 1, 1)
  )
}

function AnomalyBadge({ count }: { count: number }) {
  if (count === 0) {
    return (
      <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded-full">
        0 anomalie
      </span>
    )
  }
  return (
    <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full">
      {count} anomalie{count > 1 ? 's' : ''}
    </span>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6"/>
    </svg>
  )
}

export function ControlsAccordion({ controls }: { controls: PublicControlSummary[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <ul data-testid="controls-list" className="flex flex-col gap-2">
      {controls.map((control) => {
        const isOpen = openId === control.id
        return (
          <li key={control.id} className="bg-slate-50 rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpenId(isOpen ? null : control.id)}
              aria-expanded={isOpen}
              className="w-full px-4 py-4 flex items-center justify-between gap-3 text-left"
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{control.verifierName}</p>
                <p className="text-slate-500 text-sm mt-0.5">{formatDate(control.submittedAt)}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <AnomalyBadge count={control.anomalyCount} />
                <ChevronIcon open={isOpen} />
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-slate-200 pt-3">
                {control.anomalies.length === 0 && control.expiryDates.length === 0 ? (
                  <p className="text-sm text-emerald-700">✓ Aucune anomalie — contrôle conforme</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {control.anomalies.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Anomalies
                        </p>
                        <ul className="flex flex-col gap-2">
                          {control.anomalies.map((a, i) => (
                            <li key={`${a.compartmentName}-${a.itemName}-${i}`} className="text-sm">
                              <span className="font-medium text-slate-800">
                                {a.compartmentName} / {a.itemName}
                              </span>
                              {a.comment && (
                                <span className="text-slate-500 block">&ldquo;{a.comment}&rdquo;</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {control.expiryDates.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
                          Péremptions saisies
                        </p>
                        <ul className="flex flex-col gap-2">
                          {control.expiryDates.map((e, i) => (
                            <li key={`${e.compartmentName}-${e.itemName}-${i}`} className="text-sm">
                              <span className="font-medium text-slate-800">
                                {e.compartmentName} / {e.itemName}
                              </span>
                              <span className="text-slate-500 block">{formatExpiryDate(e.date)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
