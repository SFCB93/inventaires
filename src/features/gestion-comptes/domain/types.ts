export type AssociationSummary = {
  id: string
  name: string
  adminEmail: string
}

export type AssociationSettings = {
  name: string
  notificationEmails: string[]
}

export type CreateAssociationInput = {
  name: string
  adminEmail: string
}

export type UpdateAssociationInput = {
  name: string
  notificationEmails: string[]
}

export type AdminAccount = {
  uid: string
  email: string
  createdAt: Date | null
}
