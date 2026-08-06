import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/shared/data/firebase-admin'
import { getAuthenticatedUser } from '@/shared/lib/auth'

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Non authentifié.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ ok: false, error: 'Fichier manquant.' }, { status: 400 })

  const ext = ALLOWED_CONTENT_TYPES[file.type]
  if (!ext) return NextResponse.json({ ok: false, error: 'Format de fichier non autorisé.' }, { status: 400 })
  if (file.size > MAX_UPLOAD_SIZE_BYTES) return NextResponse.json({ ok: false, error: 'Fichier trop volumineux.' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const token = crypto.randomUUID()
    const path = `materiels/${crypto.randomUUID()}/photo.${ext}`
    const fileRef = adminStorage.bucket().file(path)

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: token },
    })

    const bucketName = adminStorage.bucket().name
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`

    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error('[upload]', error)
    return NextResponse.json({ ok: false, error: "L'upload a échoué. Veuillez réessayer." }, { status: 500 })
  }
}
