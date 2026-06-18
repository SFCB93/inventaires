'use client'

import { selectAssociationAction } from '../domain/actions'
import type { AssociationSummary } from '../domain/types'

interface AssociationsPickerPageProps {
  associations: AssociationSummary[]
}

export function AssociationsPickerPage({ associations }: AssociationsPickerPageProps) {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Mes associations</h1>
      <p className="text-slate-500 mb-8">Choisissez l&apos;association que vous souhaitez administrer.</p>

      <div className="space-y-3">
        {associations.map((a) => (
          <form key={a.id} action={selectAssociationAction.bind(null, a.id)}>
            <button
              type="submit"
              className="w-full flex items-center justify-between px-5 py-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all text-left"
            >
              <span className="font-medium text-slate-900">{a.name}</span>
              <span className="text-sm text-blue-600 font-medium">Administrer →</span>
            </button>
          </form>
        ))}
      </div>
    </div>
  )
}
