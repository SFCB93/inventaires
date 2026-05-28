'use client'

import type { AssociationSettings, AdminAccount } from '../domain/types'
import { useParametresPage } from './hooks/useParametresPage'
import { NotificationEmailsEditor } from './NotificationEmailsEditor'
import { AdminAccountsSection } from './AdminAccountsSection'

interface ParametresPageProps {
  settings: AssociationSettings
  adminAccounts: AdminAccount[]
  currentUserUid: string
}

export function ParametresPage({ settings, adminAccounts, currentUserUid }: ParametresPageProps) {
  const {
    name, setName,
    emails, newEmail, setNewEmail, emailError, addEmail, removeEmail,
    alertThresholdDays, setAlertThresholdDays,
    alertIntervalDays, setAlertIntervalDays,
    isSaving, error, success, handleSave,
  } = useParametresPage(settings)

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres</h1>

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Informations</h2>
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
        />
      </section>

      <AdminAccountsSection initialAccounts={adminAccounts} currentUserUid={currentUserUid} />

      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Alertes de péremption</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="alert-threshold" className="block text-sm font-medium text-slate-700 mb-1">
              Seuil "à risque" (jours avant expiration)
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
      </section>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          Paramètres enregistrés.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isSaving || !name.trim()}
        data-testid="btn-save-settings"
        className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold
                   hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {isSaving ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </div>
  )
}
