import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ok, err } from '@/shared/domain/result'
import { runVehiclePoweredAlertsCronUseCase } from './powered-alert-use-case'
import { vehicleTrackingRepository } from '../data/repository'
import { sendVehiclePoweredAlertEmail } from './email-service'

vi.mock('../data/repository', () => ({
  vehicleTrackingRepository: {
    listPoweredTooLong: vi.fn(),
    listInventoryNames: vi.fn(),
    listAssociationNotificationConfigs: vi.fn(),
    markPoweredAlertSent: vi.fn(),
  },
}))

vi.mock('./email-service', () => ({
  sendVehiclePoweredAlertEmail: vi.fn(),
}))

const overdueVehicle = (inventoryId: string, associationId: string) => ({
  inventoryId,
  associationId,
  stableSince: new Date('2026-01-01T00:00:00Z'),
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe('runVehiclePoweredAlertsCronUseCase', () => {
  it("ne fait rien si aucun véhicule n'est alimenté trop longtemps", async () => {
    vi.mocked(vehicleTrackingRepository.listPoweredTooLong).mockResolvedValue(ok([]))

    const result = await runVehiclePoweredAlertsCronUseCase()

    expect(result).toEqual(ok({ processed: 0, sent: 0, errors: [] }))
    expect(vehicleTrackingRepository.listInventoryNames).not.toHaveBeenCalled()
    expect(sendVehiclePoweredAlertEmail).not.toHaveBeenCalled()
  })

  it('regroupe les véhicules d’une même association dans un seul mail', async () => {
    vi.mocked(vehicleTrackingRepository.listPoweredTooLong).mockResolvedValue(
      ok([overdueVehicle('inv-1', 'assoc-1'), overdueVehicle('inv-2', 'assoc-1')]),
    )
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(
      ok(new Map([['inv-1', 'Fourgon'], ['inv-2', 'Camion']])),
    )
    vi.mocked(vehicleTrackingRepository.listAssociationNotificationConfigs).mockResolvedValue(
      ok(new Map([['assoc-1', { name: 'Asso', notificationEmails: ['resp@asso.fr'] }]])),
    )
    vi.mocked(vehicleTrackingRepository.markPoweredAlertSent).mockResolvedValue(ok(undefined))

    const result = await runVehiclePoweredAlertsCronUseCase()

    expect(sendVehiclePoweredAlertEmail).toHaveBeenCalledTimes(1)
    expect(sendVehiclePoweredAlertEmail).toHaveBeenCalledWith(
      expect.objectContaining({ recipients: ['resp@asso.fr'], associationName: 'Asso', vehicles: expect.arrayContaining([
        expect.objectContaining({ name: 'Fourgon' }),
        expect.objectContaining({ name: 'Camion' }),
      ]) }),
    )
    expect(vehicleTrackingRepository.markPoweredAlertSent).toHaveBeenCalledTimes(2)
    expect(result).toEqual(ok({ processed: 2, sent: 1, errors: [] }))
  })

  it("n'envoie rien pour une association sans adresse de notification", async () => {
    vi.mocked(vehicleTrackingRepository.listPoweredTooLong).mockResolvedValue(ok([overdueVehicle('inv-1', 'assoc-1')]))
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(ok(new Map([['inv-1', 'Fourgon']])))
    vi.mocked(vehicleTrackingRepository.listAssociationNotificationConfigs).mockResolvedValue(
      ok(new Map([['assoc-1', { name: 'Asso', notificationEmails: [] }]])),
    )

    const result = await runVehiclePoweredAlertsCronUseCase()

    expect(sendVehiclePoweredAlertEmail).not.toHaveBeenCalled()
    expect(vehicleTrackingRepository.markPoweredAlertSent).not.toHaveBeenCalled()
    expect(result).toEqual(ok({ processed: 1, sent: 0, errors: [] }))
  })

  it('propage une erreur si la recherche des véhicules en dépassement échoue', async () => {
    vi.mocked(vehicleTrackingRepository.listPoweredTooLong).mockResolvedValue(err('Firestore indisponible.'))

    const result = await runVehiclePoweredAlertsCronUseCase()

    expect(result).toEqual(err('Firestore indisponible.'))
  })

  it('consigne une erreur par association sans bloquer les autres', async () => {
    vi.mocked(vehicleTrackingRepository.listPoweredTooLong).mockResolvedValue(
      ok([overdueVehicle('inv-1', 'assoc-1'), overdueVehicle('inv-2', 'assoc-2')]),
    )
    vi.mocked(vehicleTrackingRepository.listInventoryNames).mockResolvedValue(
      ok(new Map([['inv-1', 'Fourgon'], ['inv-2', 'Camion']])),
    )
    vi.mocked(vehicleTrackingRepository.listAssociationNotificationConfigs).mockResolvedValue(
      ok(new Map([
        ['assoc-1', { name: 'Asso 1', notificationEmails: ['a@asso1.fr'] }],
        ['assoc-2', { name: 'Asso 2', notificationEmails: ['a@asso2.fr'] }],
      ])),
    )
    vi.mocked(vehicleTrackingRepository.markPoweredAlertSent).mockResolvedValue(ok(undefined))
    vi.mocked(sendVehiclePoweredAlertEmail)
      .mockRejectedValueOnce(new Error('Resend indisponible'))
      .mockResolvedValueOnce(undefined)

    const result = await runVehiclePoweredAlertsCronUseCase()

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.sent).toBe(1)
    expect(result.ok && result.value.errors).toHaveLength(1)
  })
})
