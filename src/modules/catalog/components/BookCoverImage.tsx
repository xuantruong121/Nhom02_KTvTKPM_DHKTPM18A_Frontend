import { BookOutlined } from '@ant-design/icons'
import { Image } from 'antd'
import { useEffect, useState } from 'react'

type BookCoverImageProps = {
  src?: string | null
  isbn?: string | null
  alt: string
  preview?: boolean
}

function getOpenLibraryCoverUrl(isbn?: string | null) {
  const normalizedIsbn = isbn?.replace(/[^0-9X]/gi, '')
  return normalizedIsbn ? `https://covers.openlibrary.org/b/isbn/${normalizedIsbn}-L.jpg?default=false` : null
}

export function BookCoverImage({ src, isbn, alt, preview = false }: BookCoverImageProps) {
  const [fallbackStep, setFallbackStep] = useState(0)
  const normalizedSrc = src?.trim()
  const fallbackSrc = getOpenLibraryCoverUrl(isbn)
  const currentSrc = fallbackStep === 0 ? normalizedSrc : fallbackStep === 1 ? fallbackSrc : null

  useEffect(() => {
    setFallbackStep(0)
  }, [fallbackSrc, normalizedSrc])

  if (!currentSrc) {
    return <BookOutlined />
  }

  return (
    <Image
      src={currentSrc}
      alt={alt}
      preview={preview}
      onError={() => setFallbackStep((step) => (step === 0 && fallbackSrc ? 1 : 2))}
    />
  )
}
