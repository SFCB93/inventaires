import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getAssociationSettingsUseCase, listAdminAccountsUseCase } from '@/features/gestion-comptes/domain/use-cases'
import { ParametresPage } from '@/features/gestion-comptes/ui/ParametresPage'

export default async function ParametresRoute() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin' && !user.associationId) redirect('/admin')

  const [settingsResult, accountsResult] = await Promise.all([
    getAssociationSettingsUseCase(user.associationId, user),
    listAdminAccountsUseCase(user.associationId, user),
  ])
  if (!settingsResult.ok) return <p className="text-red-600 p-8">{settingsResult.error}</p>

  return (
    <ParametresPage
      settings={settingsResult.value}
      adminAccounts={accountsResult.ok ? accountsResult.value : []}
      currentUserUid={user.uid}
    />
  )
}
