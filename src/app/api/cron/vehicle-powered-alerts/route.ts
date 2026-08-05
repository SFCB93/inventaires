import { runVehiclePoweredAlertsCronUseCase } from '@/features/vehicle-tracking/domain/powered-alert-use-case'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const result = await runVehiclePoweredAlertsCronUseCase()

  if (!result.ok) {
    return Response.json({ error: result.error }, { status: 500 })
  }

  return Response.json(result.value, { status: 200 })
}
