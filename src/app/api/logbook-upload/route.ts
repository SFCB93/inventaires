import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/shared/data/firebase-admin'
import { vehicleTrackingRepository } from '@/features/vehicle-tracking/data/repository'
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_UPLOAD_MIME_TYPES } from '@/features/logbook/domain/constants'

// Endpoint public (frontoffice non authentifié) : le carnet de bord est accessible sans session.
// Sécurité : limité aux inventaires ayant un device IoT associé (= véhicules), taille et type de fichier bornés.
export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const inventoryId = formData.get('inventoryId') as string | null

  if (!file) return NextResponse.json({ ok: false, error: 'Fichier manquant.' }, { status: 400 })
  if (!inventoryId) return NextResponse.json({ ok: false, error: 'Inventaire manquant.' }, { status: 400 })
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ ok: false, error: 'Fichier trop volumineux (10 Mo maximum).' }, { status: 400 })
  }
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ ok: false, error: 'Type de fichier non autorisé.' }, { status: 400 })
  }

  const hasDeviceResult = await vehicleTrackingRepository.hasDevice(inventoryId)
  if (!hasDeviceResult.ok || !hasDeviceResult.value) {
    return NextResponse.json({ ok: false, error: 'Inventaire introuvable.' }, { status: 404 })
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const token = crypto.randomUUID()
    const ext = file.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '') ?? 'bin'
    const path = `logbook/${inventoryId}/${crypto.randomUUID()}.${ext}`
    const fileRef = adminStorage.bucket().file(path)

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: token },
    })

    const bucketName = adminStorage.bucket().name
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`

    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error('[logbook-upload]', error)
    return NextResponse.json({ ok: false, error: "L'upload a échoué. Veuillez réessayer." }, { status: 500 })
  }
}
