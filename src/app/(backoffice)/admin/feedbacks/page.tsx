import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { listFeedbacksUseCase } from '@/features/superadmin/domain/use-cases'
import { FeedbacksPage } from '@/features/superadmin/ui/FeedbacksPage'

export default async function FeedbacksRoute() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role !== 'superadmin') redirect('/dashboard/inventaires')

  const result = await listFeedbacksUseCase(user)
  if (!result.ok) return <p className="text-red-600 p-8">{result.error}</p>

  return <FeedbacksPage feedbacks={result.value} />
}
