export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelativeDuration(date: Date, now: Date = new Date()): string {
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `${diffMin} min`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} h`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays} j`
}
