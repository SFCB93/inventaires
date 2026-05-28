'use client'

import type { AdminAccount } from '../domain/types'
import { useAdminAccounts } from './hooks/useAdminAccounts'
import { InviteAdminForm } from './InviteAdminForm'

interface AdminAccountsSectionProps {
  initialAccounts: AdminAccount[]
  currentUserUid: string
}

export function AdminAccountsSection({ initialAccounts, currentUserUid }: AdminAccountsSectionProps) {
  const {
    accounts, showInvite, inviteEmail, setInviteEmail, isInviting, inviteError, inviteSuccess,
    removingUid, removeError, isResetting, resetSuccess, resetError,
    handleInvite, handleRemove, handlePasswordReset, openInvite, cancelInvite,
  } = useAdminAccounts(initialAccounts)

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Comptes administrateurs</h2>

      <ul className="space-y-2 mb-4">
        {accounts.map((account) => (
          <li key={account.uid || account.email} className="flex items-center justify-between gap-3 py-1.5">
            <div>
              <p className="text-sm text-slate-800">{account.email}</p>
              {account.createdAt && (
                <p className="text-xs text-slate-400">
                  Créé le {account.createdAt.toLocaleDateString('fr-FR')}
                </p>
              )}
            </div>
            {account.uid && account.uid !== currentUserUid && (
              <button
                type="button"
                data-testid={`btn-remove-admin-${account.uid}`}
                onClick={() => handleRemove(account.uid)}
                disabled={removingUid === account.uid}
                className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                aria-label={`Supprimer le compte ${account.email}`}
              >
                {removingUid === account.uid ? 'Suppression…' : 'Supprimer'}
              </button>
            )}
          </li>
        ))}
      </ul>

      {removeError && <p role="alert" className="text-xs text-red-600 mb-3">{removeError}</p>}

      {showInvite ? (
        <InviteAdminForm
          email={inviteEmail}
          isSubmitting={isInviting}
          error={inviteError}
          onEmailChange={setInviteEmail}
          onSubmit={handleInvite}
          onCancel={cancelInvite}
        />
      ) : (
        <button
          type="button"
          data-testid="btn-open-invite"
          onClick={openInvite}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          + Inviter un administrateur
        </button>
      )}

      {inviteSuccess && (
        <p className="mt-2 text-xs text-green-600">Invitation envoyée.</p>
      )}

      <div className="mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          data-testid="btn-password-reset"
          onClick={handlePasswordReset}
          disabled={isResetting}
          className="text-sm text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          {isResetting ? 'Envoi en cours…' : 'Changer mon mot de passe'}
        </button>
        {resetSuccess && <p className="mt-1 text-xs text-green-600">Un lien a été envoyé à votre adresse email.</p>}
        {resetError && <p role="alert" className="mt-1 text-xs text-red-600">{resetError}</p>}
      </div>
    </section>
  )
}
