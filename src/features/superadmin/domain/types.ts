export type AssociationSummary = {
  id: string
  name: string
  adminEmail: string
}

export type CreateAssociationInput = {
  name: string
  adminEmail: string
}

export type FeedbackRow = {
  id: string
  submittedAt: string
  rating: number
  comment: string
  verifierName: string
}
