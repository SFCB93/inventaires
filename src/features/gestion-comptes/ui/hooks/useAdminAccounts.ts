'use client'

import { useState } from 'react'
import { inviteAdminAction, removeAdminAction, sendPasswordResetAction } from '../../domain/actions'
import type { AdminAccount } from '../../domain/types'

export function useAdminAccounts(initialAccounts: AdminAccount[]) {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | undefined>()
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [removingUid, setRemovingUid] = useState<string | null>(null)
  const [removeError, setRemoveError] = useState<string | undefined>()
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | undefined>()

  async function handleInvite() {
    setIsInviting(true)
    setInviteError(undefined)
    const result = await inviteAdminAction(inviteEmail)
    setIsInviting(false)
    if (!result.ok) { setInviteError(result.error); return }
    setInviteSuccess(true)
    setShowInvite(false)
    setInviteEmail('')
    setAccounts((prev) => [...prev, { uid: '', email: inviteEmail, createdAt: new Date() }])
  }

  async function handleRemove(uid: string) {
    setRemovingUid(uid)
    setRemoveError(undefined)
    const result = await removeAdminAction(uid)
    setRemovingUid(null)
    if (!result.ok) { setRemoveError(result.error); return }
    setAccounts((prev) => prev.filter((a) => a.uid !== uid))
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

  function openInvite() { setShowInvite(true); setInviteError(undefined); setInviteSuccess(false) }
  function cancelInvite() { setShowInvite(false); setInviteEmail(''); setInviteError(undefined) }

  return {
    accounts, showInvite, inviteEmail, setInviteEmail, isInviting, inviteError, inviteSuccess,
    removingUid, removeError, isResetting, resetSuccess, resetError,
    handleInvite, handleRemove, handlePasswordReset, openInvite, cancelInvite,
  }
}
