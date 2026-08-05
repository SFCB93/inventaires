import { receiveVehicleStatusUseCase } from '@/features/vehicle-tracking/domain/use-cases'
import { ERROR_UNAUTHORIZED, ERROR_RATE_LIMITED } from '@/features/vehicle-tracking/domain/constants'

interface VehicleStatusPayload {
  lat?: unknown
  lng?: unknown
  isCircuitCut?: unknown
  timestamp?: unknown
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const apiKey = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null
  if (!apiKey) return new Response('Unauthorized', { status: 401 })

  let body: VehicleStatusPayload
  try {
    body = await request.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const lat = typeof body.lat === 'number' ? body.lat : NaN
  const lng = typeof body.lng === 'number' ? body.lng : NaN
  if (typeof body.isCircuitCut !== 'boolean') return new Response('Bad Request', { status: 400 })
  const timestamp =
    typeof body.timestamp === 'string' || typeof body.timestamp === 'number'
      ? new Date(body.timestamp)
      : new Date(NaN)

  const result = await receiveVehicleStatusUseCase({ apiKey, lat, lng, isCircuitCut: body.isCircuitCut, timestamp })

  if (!result.ok) {
    if (result.error === ERROR_UNAUTHORIZED) return new Response('Unauthorized', { status: 401 })
    if (result.error === ERROR_RATE_LIMITED) return new Response('Too Many Requests', { status: 429 })
    return new Response('Bad Request', { status: 400 })
  }

  return new Response(null, { status: 200 })
}
