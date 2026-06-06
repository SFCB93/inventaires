'use client'
import { useState } from 'react'
import { updateAssociationSettingsAction, sendPasswordResetAction } from '../../domain/actions'
import type { AssociationSettings } from '../../domain/types'

export function useSettingsPage(initial: AssociationSettings) {
  const [name, setName] = useState(initial.name)
  const [emails, setEmails] = useState(initial.notificationEmails)
  const [newEmail, setNewEmail] = useState('')
  const [emailError, setEmailError] = useState<string | undefined>()
  const [alertThresholdDays, setAlertThresholdDays] = useState(initial.alertThresholdDays)
  const [alertIntervalDays, setAlertIntervalDays] = useState(initial.alertIntervalDays)

  const [nameSaving, setNameSaving] = useState(false)
  const [nameError, setNameError] = useState<string | undefined>()
  const [nameSuccess, setNameSuccess] = useState(false)

  const [emailsSaving, setEmailsSaving] = useState(false)
  const [emailsSaveError, setEmailsSaveError] = useState<string | undefined>()
  const [emailsSuccess, setEmailsSuccess] = useState(false)

  const [alertsSaving, setAlertsSaving] = useState(false)
  const [alertsError, setAlertsError] = useState<string | undefined>()
  const [alertsSuccess, setAlertsSuccess] = useState(false)

  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | undefined>()

  async function saveEmailsList(list: string[]) {
    setEmailsSaving(true)
    setEmailsSaveError(undefined)
    setEmailsSuccess(false)
    const result = await updateAssociationSettingsAction({ name, notificationEmails: list, alertThresholdDays, alertIntervalDays })
    setEmailsSaving(false)
    if (!result.ok) { setEmailsSaveError(result.error); return }
    setEmailsSuccess(true)
  }

  function addEmail() {
    if (!newEmail.includes('@')) { setEmailError('Email invalide.'); return }
    if (emails.includes(newEmail)) { setEmailError('Cet email est déjà dans la liste.'); return }
    const updated = [...emails, newEmail]
    setEmails(updated)
    setNewEmail('')
    setEmailError(undefined)
    saveEmailsList(updated)
  }

  function removeEmail(email: string) {
    const updated = emails.filter(e => e !== email)
    setEmails(updated)
    saveEmailsList(updated)
  }

  async function saveName() {
    setNameSaving(true)
    setNameError(undefined)
    setNameSuccess(false)
    const result = await updateAssociationSettingsAction({ name, notificationEmails: emails, alertThresholdDays, alertIntervalDays })
    setNameSaving(false)
    if (!result.ok) { setNameError(result.error); return }
    setNameSuccess(true)
  }

  async function saveAlerts() {
    setAlertsSaving(true)
    setAlertsError(undefined)
    setAlertsSuccess(false)
    const result = await updateAssociationSettingsAction({ name, notificationEmails: emails, alertThresholdDays, alertIntervalDays })
    setAlertsSaving(false)
    if (!result.ok) { setAlertsError(result.error); return }
    setAlertsSuccess(true)
  }

  async function handlePasswordReset() {
    setIsResetting(true)
    setResetError(undefined)
    setResetSuccess(false)
    const result = await sendPasswordResetAction()
    setIsResetting(false)
    if (!result.ok) { setResetError(result.error); return }
    setResetSuccess(true)
  }

  return {
    name, setName,
    emails, newEmail, setNewEmail, emailError, addEmail, removeEmail,
    emailsSaving, emailsSaveError, emailsSuccess,
    alertThresholdDays, setAlertThresholdDays,
    alertIntervalDays, setAlertIntervalDays,
    nameSaving, nameError, nameSuccess, saveName,
    alertsSaving, alertsError, alertsSuccess, saveAlerts,
    isResetting, resetSuccess, resetError, handlePasswordReset,
  }
}
