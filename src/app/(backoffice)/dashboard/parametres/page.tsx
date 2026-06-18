import { redirect } from 'next/navigation'
import { getAuthenticatedUser } from '@/shared/lib/auth'
import { getAssociationSettingsUseCase } from '@/features/settings/domain/use-cases'
import { listAdminAccountsUseCase } from '@/features/team/domain/use-cases'
import { SettingsPage } from '@/features/settings/ui/SettingsPage'

export default async function ParametresRoute() {
  const user = await getAuthenticatedUser()
  if (!user) redirect('/login')
  if (user.role === 'superadmin' && !user.associationId) redirect('/admin')
  if (user.role === 'admin' && !user.associationId) redirect('/associations')

  const [settingsResult, accountsResult] = await Promise.all([
    getAssociationSettingsUseCase(user.associationId, user),
    listAdminAccountsUseCase(user.associationId, user),
  ])
  if (!settingsResult.ok) return <p className="text-red-600 p-8">{settingsResult.error}</p>

  return (
    <SettingsPage
      settings={settingsResult.value}
      adminAccounts={accountsResult.ok ? accountsResult.value : []}
      currentUserUid={user.uid}
    />
  )
}
