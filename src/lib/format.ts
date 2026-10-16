import type { Currency } from '@/types'

const formatters = new Map<string, Intl.NumberFormat>()

const getFormatter = (currency: Currency, locale: string) => {
  const key = `${locale}:${currency}`
  let formatter = formatters.get(key)
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
    formatters.set(key, formatter)
  }
  return formatter
}

export const formatPrice = (value: number, currency: Currency = 'USD', locale = 'en-US') =>
  getFormatter(currency, locale).format(value)
