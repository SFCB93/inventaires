'use client'

import { useState } from 'react'
import type { DisinfectionProtocol } from '../domain/types'
import { LogFormHeader } from './LogFormHeader'
import { DisinfectionChecklist } from './DisinfectionChecklist'

interface DisinfectionLogFormProps {
  isSubmitting?: boolean
  error?: string
  onSubmit: (protocol: DisinfectionProtocol) => void
  onBack: () => void
}

const PROTOCOLS: { protocol: DisinfectionProtocol; label: string }[] = [
  { protocol: 'periodique', label: 'Désinfection périodique' },
  { protocol: 'approfondie', label: 'Désinfection approfondie' },
]

export function DisinfectionLogForm({ isSubmitting = false, error, onSubmit, onBack }: DisinfectionLogFormProps) {
  const [protocol, setProtocol] = useState<DisinfectionProtocol | null>(null)

  return (
    <div className="flex flex-col min-h-dvh bg-white">
      <LogFormHeader title="Désinfection" onBack={protocol ? () => setProtocol(null) : onBack} />

      <div className="flex-1 px-5 py-5 space-y-6">
        {!protocol ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Choisissez le protocole réalisé :</p>
            {PROTOCOLS.map(({ protocol: value, label }) => (
              <button
                key={value}
                type="button"
                data-testid={`btn-disinfection-protocol-${value}`}
                onClick={() => setProtocol(value)}
                className="w-full h-16 rounded-2xl border-2 border-slate-200 bg-white flex items-center px-5
                           text-left text-lg font-semibold text-slate-900 active:scale-95 transition-transform"
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <>
            <DisinfectionChecklist protocol={protocol} />

            {error && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              type="button"
              data-testid="btn-submit-disinfection"
              onClick={() => onSubmit(protocol)}
              disabled={isSubmitting}
              className="w-full h-14 rounded-2xl bg-blue-600 text-white text-base font-semibold shadow-md shadow-blue-100 disabled:opacity-50 active:scale-95 transition-transform"
            >
              {isSubmitting ? 'Envoi en cours…' : 'Confirmer la désinfection'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
