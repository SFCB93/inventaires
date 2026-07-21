'use client'

import { useRouter } from 'next/navigation'
import type { AssociationSummary } from '../domain/types'
import { useNewAssociationForm } from './hooks/useNewAssociationForm'
import { NewAssociationForm } from './NewAssociationForm'
import { enterAssociationAction } from '../domain/actions'

interface SuperadminPageProps {
  associations: AssociationSummary[]
}

export function SuperadminPage({ associations }: SuperadminPageProps) {
  const router = useRouter()
  const form = useNewAssociationForm(() => router.refresh())

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Associations</h1>
        <button
          onClick={form.open}
          data-testid="btn-new-association"
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold
                     hover:bg-blue-700 transition-colors"
        >
          Nouvelle association
        </button>
      </div>

      {form.isOpen && (
        <div className="mb-6">
          <NewAssociationForm
            name={form.name}
            email={form.email}
            isSubmitting={form.isSubmitting}
            error={form.error}
            onNameChange={form.setName}
            onEmailChange={form.setEmail}
            onSubmit={form.handleSubmit}
            onCancel={form.close}
          />
        </div>
      )}

      {associations.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Aucune association enregistrée.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Association</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Email admin</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {associations.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                    <td className="px-4 py-3 text-slate-500">{a.adminEmail}</td>
                    <td className="px-4 py-3 text-right">
                      <form action={enterAssociationAction.bind(null, a.id)}>
                        <button
                          type="submit"
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                        >
                          Administrer →
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
