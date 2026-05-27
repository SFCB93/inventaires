import { NextRequest, NextResponse } from 'next/server'
import { adminStorage } from '@/shared/data/firebase-admin'
import { getAuthenticatedUser } from '@/shared/lib/auth'

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser()
  if (!user) return NextResponse.json({ ok: false, error: 'Non authentifié.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ ok: false, error: 'Fichier manquant.' }, { status: 400 })

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const token = crypto.randomUUID()
    const path = `materiels/${crypto.randomUUID()}/${file.name}`
    const fileRef = adminStorage.bucket().file(path)

    await fileRef.save(buffer, {
      contentType: file.type,
      metadata: { firebaseStorageDownloadTokens: token },
    })

    const bucketName = adminStorage.bucket().name
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(path)}?alt=media&token=${token}`

    return NextResponse.json({ ok: true, url, path })
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 })
  }
}
