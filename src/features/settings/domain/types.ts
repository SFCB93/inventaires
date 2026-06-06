export type AssociationSettings = {
  name: string
  notificationEmails: string[]
  alertThresholdDays: number
  alertIntervalDays: number
}

export type UpdateAssociationInput = {
  name: string
  notificationEmails: string[]
  alertThresholdDays: number
  alertIntervalDays: number
}
