'use client'

import type { AssociationSettings } from '../domain/types'
import type { AdminAccount } from '@/features/team/domain/types'
import { useSettingsPage } from './hooks/useSettingsPage'
import { NotificationEmailsEditor } from './NotificationEmailsEditor'
import { AdminAccountsSection } from '@/features/team/ui/AdminAccountsSection'

interface SettingsPageProps {
  settings: AssociationSettings
  adminAccounts: AdminAccount[]
  currentUserUid: string
}

export function SettingsPage({ settings, adminAccounts, currentUserUid }: SettingsPageProps) {
  const {
    name, setName,
    emails, newEmail, setNewEmail, emailError, addEmail, removeEmail,
    emailsSaving, emailsSaveError, emailsSuccess,
    alertThresholdDays, setAlertThresholdDays,
    alertIntervalDays, setAlertIntervalDays,
    nameSaving, nameError, nameSuccess, saveName,
    alertsSaving, alertsError, alertsSuccess, saveAlerts,
    isResetting, resetSuccess, resetError, handlePasswordReset,
  } = useSettingsPage(settings)

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Informations</h2>
        <div>
          <label htmlFor="assoc-name" className="block text-sm font-medium text-slate-700 mb-1">
            Nom de l'association
          </label>
          <input
            id="assoc-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-assoc-name"
            className="w-full h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                       focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        {nameError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{nameError}</p>
        )}
        {nameSuccess && (
          <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">Enregistré.</p>
        )}
        <button
          onClick={saveName}
          disabled={nameSaving || !name.trim()}
          data-testid="btn-save-name"
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                     hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {nameSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Emails de notification</h2>
        <NotificationEmailsEditor
          emails={emails}
          newEmail={newEmail}
          emailError={emailError}
          onNewEmailChange={setNewEmail}
          onAdd={addEmail}
          onRemove={removeEmail}
          isSaving={emailsSaving}
          saveError={emailsSaveError}
          saveSuccess={emailsSuccess}
        />
      </section>

      <AdminAccountsSection initialAccounts={adminAccounts} currentUserUid={currentUserUid} />

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Alertes de péremption</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="alert-threshold" className="block text-sm font-medium text-slate-700 mb-1">
              Seuil &ldquo;à risque&rdquo; (jours avant expiration)
            </label>
            <input
              id="alert-threshold"
              type="number"
              min="1"
              value={alertThresholdDays}
              onChange={(e) => setAlertThresholdDays(Math.max(1, parseInt(e.target.value) || 1))}
              data-testid="input-alert-threshold"
              className="w-32 h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="alert-interval" className="block text-sm font-medium text-slate-700 mb-1">
              Intervalle entre deux alertes mail par item (jours)
            </label>
            <input
              id="alert-interval"
              type="number"
              min="1"
              value={alertIntervalDays}
              onChange={(e) => setAlertIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
              data-testid="input-alert-interval"
              className="w-32 h-10 rounded-lg border-2 border-slate-200 px-3 text-sm
                         focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
        {alertsError && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{alertsError}</p>
        )}
        {alertsSuccess && (
          <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">Enregistré.</p>
        )}
        <button
          onClick={saveAlerts}
          disabled={alertsSaving}
          data-testid="btn-save-alerts"
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                     hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {alertsSaving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Mon compte</h2>
        <button
          type="button"
          onClick={handlePasswordReset}
          disabled={isResetting}
          data-testid="btn-password-reset"
          className="text-sm text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
        >
          {isResetting ? 'Envoi en cours…' : 'Changer mon mot de passe'}
        </button>
        {resetSuccess && <p className="text-xs text-green-600">Un lien a été envoyé à votre adresse email.</p>}
        {resetError && <p role="alert" className="text-xs text-red-600">{resetError}</p>}
      </section>
    </div>
  )
}
