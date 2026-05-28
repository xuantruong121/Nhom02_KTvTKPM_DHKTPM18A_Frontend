import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuthUser } from '@/shared/store/authStore'

const FAVORITES_EVENT = 'sebook:favorites-changed'

function getStorageKey(userId?: number | null, email?: string) {
  return `sebook_favorite_books:${userId ?? email ?? 'guest'}`
}

function readFavoriteIds(key: string) {
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.map(Number).filter(Number.isFinite)
  } catch {
    return []
  }
}

function writeFavoriteIds(key: string, ids: number[]) {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(new Set(ids))))
    window.dispatchEvent(new Event(FAVORITES_EVENT))
  } catch {
    // ignore storage quota / privacy mode
  }
}

export function useFavoriteBooks() {
  const user = useAuthUser()
  const storageKey = useMemo(() => getStorageKey(user?.userId, user?.email), [user?.email, user?.userId])
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => readFavoriteIds(storageKey))

  useEffect(() => {
    const syncFavorites = () => setFavoriteIds(readFavoriteIds(storageKey))
    syncFavorites()
    window.addEventListener('storage', syncFavorites)
    window.addEventListener(FAVORITES_EVENT, syncFavorites)
    return () => {
      window.removeEventListener('storage', syncFavorites)
      window.removeEventListener(FAVORITES_EVENT, syncFavorites)
    }
  }, [storageKey])

  const favoriteIdSet = useMemo(() => new Set(favoriteIds), [favoriteIds])

  const isFavorite = useCallback(
    (bookId: number) => favoriteIdSet.has(bookId),
    [favoriteIdSet]
  )

  const addFavorite = useCallback(
    (bookId: number) => {
      const nextIds = Array.from(new Set([...readFavoriteIds(storageKey), bookId]))
      writeFavoriteIds(storageKey, nextIds)
      setFavoriteIds(nextIds)
    },
    [storageKey]
  )

  const removeFavorite = useCallback(
    (bookId: number) => {
      const nextIds = readFavoriteIds(storageKey).filter((id) => id !== bookId)
      writeFavoriteIds(storageKey, nextIds)
      setFavoriteIds(nextIds)
    },
    [storageKey]
  )

  const toggleFavorite = useCallback(
    (bookId: number) => {
      if (isFavorite(bookId)) {
        removeFavorite(bookId)
        return false
      }
      addFavorite(bookId)
      return true
    },
    [addFavorite, isFavorite, removeFavorite]
  )

  return {
    favoriteIds,
    isFavorite,
    addFavorite,
    removeFavorite,
    toggleFavorite,
  }
}
