export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export function todayPlusDays(n: number): Date {
  const d = startOfToday()
  d.setDate(d.getDate() + n)
  return d
}

export function todayMinusDays(n: number): Date {
  return todayPlusDays(-n)
}
