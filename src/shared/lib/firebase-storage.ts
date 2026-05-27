export async function uploadItemPhoto(file: File): Promise<{ url: string; path: string }> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch('/api/upload', { method: 'POST', body: formData })
  const data = await response.json()
  if (!data.ok) throw new Error(data.error ?? "Échec de l'upload.")
  return { url: data.url, path: data.path }
}
