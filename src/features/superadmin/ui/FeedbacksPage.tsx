import type { FeedbackRow } from '../domain/types'

interface FeedbacksPageProps {
  feedbacks: FeedbackRow[]
}

function formatDate(iso: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="text-amber-400 tracking-tight">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export function FeedbacksPage({ feedbacks }: FeedbacksPageProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Feedbacks</h1>

      {feedbacks.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Aucun feedback reçu pour l'instant.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Date</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Note</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Commentaire</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">Auteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {feedbacks.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(row.submittedAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap"><Stars rating={row.rating} /></td>
                  <td className="px-4 py-3 text-slate-700">{row.comment}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.verifierName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
