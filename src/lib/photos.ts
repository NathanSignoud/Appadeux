import { useEffect, useState } from 'react'
import { supabase } from './supabase'

/** Réduit une photo du téléphone avant envoi : 1600 px max, JPEG 82 % (≈ 300 Ko au lieu de 4 Mo). */
export async function compressImage(file: File, max = 1600, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image illisible'))), 'image/jpeg', quality))
}

// URLs signées valables 1 h, gardées en mémoire 50 min pour ne pas les redemander à chaque écran
const TTL_S = 3600
const cache = new Map<string, { url: string; until: number }>()

/** Chemins du bucket privé → URLs signées temporaires. */
export function useSignedUrls(bucket: string, paths: string[]) {
  const [, setVersion] = useState(0)
  const key = paths.join('|')

  useEffect(() => {
    const missing = key ? key.split('|').filter((p) => (cache.get(p)?.until ?? 0) < Date.now()) : []
    if (missing.length === 0) return
    let alive = true
    void supabase.storage
      .from(bucket)
      .createSignedUrls(missing, TTL_S)
      .then(({ data }) => {
        for (const item of data ?? []) if (item.path && item.signedUrl) cache.set(item.path, { url: item.signedUrl, until: Date.now() + (TTL_S - 600) * 1000 })
        if (alive) setVersion((v) => v + 1)
      })
    return () => {
      alive = false
    }
  }, [bucket, key])

  return (path: string | undefined) => (path ? cache.get(path)?.url : undefined)
}
