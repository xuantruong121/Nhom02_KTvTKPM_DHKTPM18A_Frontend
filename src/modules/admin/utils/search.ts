export function normalizeSearchText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function matchesKeyword(keyword: string, ...values: unknown[]) {
  const normalizedKeyword = normalizeSearchText(keyword)
  if (!normalizedKeyword) return true
  return values.some((value) => normalizeSearchText(value).includes(normalizedKeyword))
}
