import type { WidgetConfig } from '@/types'
import {
  buildWidgetUrl,
  DEFAULT_WIDGET_CONFIG,
  getWidgetSize,
  parseWidgetConfig,
  resolveTextColor,
  resolveTitle,
  WIDGET_LAYOUT,
  WIDGET_LIMITS,
} from './widgetConfig'

const ORIGIN = 'https://widget.test'

const parse = (query: string) => parseWidgetConfig(new URLSearchParams(query))

const parseOk = (query: string) => {
  const result = parse(query)
  if (!result.ok) throw new Error(result.error)
  return result.config
}

const fullConfig: WidgetConfig = {
  tcg: 3,
  setId: 23651,
  total: 12,
  showPrice: false,
  currency: 'USD',
  duration: 7,
  textColor: '#ff8800',
  showTitle: false,
  title: 'Lo mejor de {set}',
  showName: true,
  animation: 'flip',
  refresh: 0,
  cardWidth: 250,
}

describe('parseWidgetConfig', () => {
  it('aplica los defaults cuando solo viene setId', () => {
    expect(parseOk('setId=604')).toEqual({ ...DEFAULT_WIDGET_CONFIG, setId: 604 })
  })

  it.each(['', 'setId=', 'setId=abc', 'setId=0', 'setId=-4', 'setId=1.5'])(
    'falla con setId inválido: "%s"',
    (query) => {
      expect(parse(query).ok).toBe(false)
    },
  )

  it('acota los valores numéricos a sus rangos', () => {
    const config = parseOk('setId=1&total=99&duration=0&cardWidth=10')
    expect(config.total).toBe(WIDGET_LIMITS.total.max)
    expect(config.duration).toBe(WIDGET_LIMITS.duration.min)
    expect(config.cardWidth).toBe(WIDGET_LIMITS.cardWidth.min)
  })

  it('usa el default ante valores no numéricos', () => {
    expect(parseOk('setId=1&total=muchas').total).toBe(DEFAULT_WIDGET_CONFIG.total)
  })

  it('desactiva el refresco con 0 o negativos y acota el resto', () => {
    expect(parseOk('setId=1&refresh=0').refresh).toBe(0)
    expect(parseOk('setId=1&refresh=-3').refresh).toBe(0)
    expect(parseOk('setId=1&refresh=1').refresh).toBe(WIDGET_LIMITS.refresh.min)
    expect(parseOk('setId=1&refresh=999').refresh).toBe(WIDGET_LIMITS.refresh.max)
  })

  it('interpreta booleanos como 1/0 y true/false', () => {
    expect(parseOk('setId=1&showPrice=0&showName=true')).toMatchObject({
      showPrice: false,
      showName: true,
    })
    expect(parseOk('setId=1&showPrice=quizas').showPrice).toBe(DEFAULT_WIDGET_CONFIG.showPrice)
  })

  it('acepta white, black y hex de 6 dígitos como color', () => {
    expect(parseOk('setId=1&textColor=black').textColor).toBe('black')
    expect(parseOk('setId=1&textColor=%23ABCDEF').textColor).toBe('#abcdef')
    expect(parseOk('setId=1&textColor=red').textColor).toBe(DEFAULT_WIDGET_CONFIG.textColor)
    expect(parseOk('setId=1&textColor=%23abc').textColor).toBe(DEFAULT_WIDGET_CONFIG.textColor)
  })

  it('ignora animaciones y monedas desconocidas', () => {
    expect(parseOk('setId=1&animation=spin&currency=EUR')).toMatchObject({
      animation: DEFAULT_WIDGET_CONFIG.animation,
      currency: DEFAULT_WIDGET_CONFIG.currency,
    })
  })

  it('recorta el título al largo máximo y usa el default si viene vacío', () => {
    const longTitle = 'x'.repeat(WIDGET_LIMITS.titleMaxLength + 10)
    expect(parseOk(`setId=1&title=${longTitle}`).title).toHaveLength(WIDGET_LIMITS.titleMaxLength)
    expect(parseOk('setId=1&title=%20%20').title).toBe(DEFAULT_WIDGET_CONFIG.title)
  })

  it('es compatible con los parámetros del widget de stream-widgets', () => {
    expect(parseOk('totalCards=10&setId=23651&textColor=black')).toMatchObject({
      setId: 23651,
      total: 10,
      textColor: 'black',
    })
  })

  it('prioriza total sobre el alias legacy totalCards', () => {
    expect(parseOk('setId=1&total=8&totalCards=12').total).toBe(8)
  })
})

describe('buildWidgetUrl', () => {
  it('genera solo setId cuando el resto son defaults', () => {
    expect(buildWidgetUrl({ ...DEFAULT_WIDGET_CONFIG, setId: 604 }, ORIGIN)).toBe(
      `${ORIGIN}/widget?setId=604`,
    )
  })

  it('serializa booleanos como 1/0 y codifica el color hex', () => {
    const url = new URL(buildWidgetUrl(fullConfig, ORIGIN))
    expect(url.searchParams.get('showPrice')).toBe('0')
    expect(url.searchParams.get('showName')).toBe('1')
    expect(url.search).toContain('textColor=%23ff8800')
  })

  it('ordena los parámetros con setId primero, sin importar el orden de las claves', () => {
    const { setId, ...settings } = fullConfig
    const url = new URL(buildWidgetUrl({ ...settings, setId }, ORIGIN))

    expect([...url.searchParams.keys()].slice(0, 3)).toEqual(['setId', 'tcg', 'total'])
  })

  it('usa window.location.origin por defecto', () => {
    expect(buildWidgetUrl({ ...DEFAULT_WIDGET_CONFIG, setId: 1 })).toBe(
      `${window.location.origin}/widget?setId=1`,
    )
  })

  it.each([
    ['defaults', { ...DEFAULT_WIDGET_CONFIG, setId: 604 }],
    ['config completa', fullConfig],
  ])('ida y vuelta con parseWidgetConfig: %s', (_, config) => {
    const url = new URL(buildWidgetUrl(config, ORIGIN))
    expect(parseOk(url.search)).toEqual(config)
  })
})

describe('resolveTitle', () => {
  const set = { setName: "Pharaoh's Servant (25th Anniversary Edition)", setCode: 'PSV-EN' }

  it('reemplaza {set} por el nombre del set', () => {
    expect(resolveTitle('Top hits {set}', set)).toBe(
      "Top hits Pharaoh's Servant (25th Anniversary Edition)",
    )
  })

  it('reemplaza {code} por el código del set', () => {
    expect(resolveTitle('Top hits {code}', set)).toBe('Top hits PSV-EN')
  })

  it('usa el nombre del set si no tiene código', () => {
    expect(resolveTitle('{code}', { setName: 'Promo', setCode: null })).toBe('Promo')
    expect(resolveTitle('{code}', { setName: 'Promo', setCode: '' })).toBe('Promo')
  })

  it('deja el texto tal cual si no tiene placeholders', () => {
    expect(resolveTitle('Mis favoritas', set)).toBe('Mis favoritas')
  })
})

describe('resolveTextColor', () => {
  it.each([
    ['white', '#ffffff'],
    ['black', '#000000'],
    ['#ff8800', '#ff8800'],
  ] as const)('%s → %s', (color, expected) => {
    expect(resolveTextColor(color)).toBe(expected)
  })
})

describe('getWidgetSize', () => {
  const base = { cardWidth: 180, showTitle: false, showName: false, showPrice: false }

  it('calcula el tamaño mínimo con solo la carta', () => {
    expect(getWidgetSize(base)).toEqual({
      width: 180 + WIDGET_LAYOUT.padding * 2,
      height: 252 + WIDGET_LAYOUT.padding * 2,
    })
  })

  it('suma el alto de título, nombre y precio cuando se muestran', () => {
    const full = getWidgetSize({ ...base, showTitle: true, showName: true, showPrice: true })

    expect(full.height - getWidgetSize(base).height).toBe(
      WIDGET_LAYOUT.titleHeight +
        WIDGET_LAYOUT.titleGap +
        WIDGET_LAYOUT.nameHeight +
        WIDGET_LAYOUT.priceHeight,
    )
  })
})
