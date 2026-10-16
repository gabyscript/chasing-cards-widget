import type { AnimationType, Currency, TextColor, WidgetConfig, WidgetSettings } from '@/types'

export const ANIMATION_TYPES: readonly AnimationType[] = ['slide', 'fade', 'flip']

export const CURRENCIES: readonly Currency[] = ['USD']

export const TITLE_SET_PLACEHOLDER = '{set}'

export const TITLE_CODE_PLACEHOLDER = '{code}'

export const WIDGET_LIMITS = {
  total: { min: 5, max: 15 },
  duration: { min: 1, max: 30 },
  refresh: { min: 5, max: 120 },
  cardWidth: { min: 120, max: 400 },
  titleMaxLength: 40,
} as const

export const DEFAULT_WIDGET_CONFIG: WidgetSettings = {
  tcg: null,
  total: 5,
  showPrice: true,
  currency: 'USD',
  duration: 3,
  textColor: 'white',
  showTitle: true,
  title: `Top hits ${TITLE_SET_PLACEHOLDER}`,
  showName: false,
  animation: 'slide',
  refresh: 30,
  cardWidth: 180,
}

const LEGACY_PARAM_ALIASES: Record<string, keyof WidgetConfig> = {
  totalCards: 'total',
}

export type ParseResult = { ok: true; config: WidgetConfig } | { ok: false; error: string }

const HEX_COLOR = /^#[0-9a-f]{6}$/i

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const toInteger = (raw: string | null): number | null => {
  if (raw === null || raw.trim() === '') return null
  const value = Number(raw)
  return Number.isFinite(value) ? Math.round(value) : null
}

const toPositiveInteger = (raw: string | null): number | null => {
  const value = raw?.trim()
  return value && /^\d+$/.test(value) && Number(value) > 0 ? Number(value) : null
}

const toBoolean = (raw: string | null, fallback: boolean) => {
  if (raw === '1' || raw === 'true') return true
  if (raw === '0' || raw === 'false') return false
  return fallback
}

const toRangedInteger = (
  raw: string | null,
  range: { min: number; max: number },
  fallback: number,
) => {
  const value = toInteger(raw)
  return value === null ? fallback : clamp(value, range.min, range.max)
}

const toRefresh = (raw: string | null) => {
  const value = toInteger(raw)
  if (value === null) return DEFAULT_WIDGET_CONFIG.refresh
  if (value <= 0) return 0
  return clamp(value, WIDGET_LIMITS.refresh.min, WIDGET_LIMITS.refresh.max)
}

const toTextColor = (raw: string | null): TextColor => {
  if (raw === 'white' || raw === 'black') return raw
  if (raw && HEX_COLOR.test(raw)) return raw.toLowerCase() as TextColor
  return DEFAULT_WIDGET_CONFIG.textColor
}

const toOption = <T extends string>(raw: string | null, options: readonly T[], fallback: T): T =>
  options.includes(raw as T) ? (raw as T) : fallback

const toTitle = (raw: string | null) => {
  const title = raw?.trim()
  return title ? title.slice(0, WIDGET_LIMITS.titleMaxLength) : DEFAULT_WIDGET_CONFIG.title
}

const withLegacyAliases = (params: URLSearchParams) => {
  const normalized = new URLSearchParams(params)
  for (const [legacy, current] of Object.entries(LEGACY_PARAM_ALIASES)) {
    const legacyValue = normalized.get(legacy)
    if (legacyValue !== null && !normalized.has(current)) {
      normalized.set(current, legacyValue)
    }
    normalized.delete(legacy)
  }
  return normalized
}

export const parseWidgetSettings = (input: URLSearchParams): WidgetSettings => {
  const params = withLegacyAliases(input)
  const defaults = DEFAULT_WIDGET_CONFIG

  return {
    tcg: toPositiveInteger(params.get('tcg')),
    total: toRangedInteger(params.get('total'), WIDGET_LIMITS.total, defaults.total),
    showPrice: toBoolean(params.get('showPrice'), defaults.showPrice),
    currency: toOption(params.get('currency'), CURRENCIES, defaults.currency),
    duration: toRangedInteger(params.get('duration'), WIDGET_LIMITS.duration, defaults.duration),
    textColor: toTextColor(params.get('textColor')),
    showTitle: toBoolean(params.get('showTitle'), defaults.showTitle),
    title: toTitle(params.get('title')),
    showName: toBoolean(params.get('showName'), defaults.showName),
    animation: toOption(params.get('animation'), ANIMATION_TYPES, defaults.animation),
    refresh: toRefresh(params.get('refresh')),
    cardWidth: toRangedInteger(
      params.get('cardWidth'),
      WIDGET_LIMITS.cardWidth,
      defaults.cardWidth,
    ),
  }
}

export const parseWidgetConfig = (input: URLSearchParams): ParseResult => {
  const setId = toPositiveInteger(input.get('setId'))
  if (setId === null) {
    return { ok: false, error: 'El parámetro setId es obligatorio y debe ser un número positivo.' }
  }

  return { ok: true, config: { setId, ...parseWidgetSettings(input) } }
}

const serialize = (value: WidgetConfig[keyof WidgetConfig]) =>
  typeof value === 'boolean' ? (value ? '1' : '0') : String(value)

const PARAM_ORDER: readonly (keyof WidgetConfig)[] = [
  'setId',
  'tcg',
  'total',
  'showPrice',
  'currency',
  'duration',
  'textColor',
  'showTitle',
  'title',
  'showName',
  'animation',
  'refresh',
  'cardWidth',
]

export const toWidgetParams = (config: WidgetSettings | WidgetConfig) => {
  const params = new URLSearchParams()

  for (const key of PARAM_ORDER) {
    const value = (config as Partial<WidgetConfig>)[key]
    if (value === undefined || value === null) continue
    if (key !== 'setId' && value === DEFAULT_WIDGET_CONFIG[key]) continue
    params.set(key, serialize(value))
  }

  return params
}

export const buildWidgetUrl = (config: WidgetConfig, origin = window.location.origin) =>
  `${origin}/widget?${toWidgetParams(config).toString()}`

export const WIDGET_LAYOUT = {
  cardAspectRatio: 1.4,
  padding: 32,
  titleHeight: 56,
  titleGap: 12,
  nameHeight: 40,
  priceHeight: 48,
} as const

export const WIDGET_TYPOGRAPHY = {
  title: { maxFontSize: 22, minFontSize: 12, lineHeight: 1.1 },
  name: { maxFontSize: 15, minFontSize: 10, lineHeight: 1.25 },
} as const

export const getCardHeight = (cardWidth: number) =>
  Math.round(cardWidth * WIDGET_LAYOUT.cardAspectRatio)

export const getWidgetSize = ({
  cardWidth,
  showTitle,
  showName,
  showPrice,
}: Pick<WidgetSettings, 'cardWidth' | 'showTitle' | 'showName' | 'showPrice'>) => ({
  width: cardWidth + WIDGET_LAYOUT.padding * 2,
  height:
    getCardHeight(cardWidth) +
    WIDGET_LAYOUT.padding * 2 +
    (showTitle ? WIDGET_LAYOUT.titleHeight + WIDGET_LAYOUT.titleGap : 0) +
    (showName ? WIDGET_LAYOUT.nameHeight : 0) +
    (showPrice ? WIDGET_LAYOUT.priceHeight : 0),
})

export const resolveTitle = (
  template: string,
  { setName, setCode }: { setName: string; setCode: string | null },
) =>
  template
    .replaceAll(TITLE_SET_PLACEHOLDER, setName)
    .replaceAll(TITLE_CODE_PLACEHOLDER, setCode || setName)
    .trim()

export const resolveTextColor = (color: TextColor) =>
  color === 'white' ? '#ffffff' : color === 'black' ? '#000000' : color
