import { TCGS } from '../../src/constants/tcgs.ts'

const CATALOG_API = 'https://mpapi.tcgplayer.com/v2/Catalog'
const PRICE_GUIDE_API = 'https://infinite-api.tcgplayer.com/priceguide'
const CDN_PRODUCT_IMAGE = 'https://tcgplayer-cdn.tcgplayer.com/product'
const PRICE_GUIDE_MAX_ROWS = 5000
const REQUEST_TIMEOUT_MS = 8000
const DEFAULT_MPFEV = '4448'

// Un juego que no está en TCGS (links antiguos) se consulta sin productTypeID.
export const cardsProductTypeId = (categoryId: number | null) =>
  TCGS.find((tcg) => tcg.id === categoryId)?.productTypeId ?? null

export interface RawSetName {
  setNameId: number
  categoryId: number
  name: string
  cleanSetName: string
  urlName: string
  abbreviation: string
  releaseDate: string | null
  isSupplemental: boolean
  active: boolean
}

export interface RawPriceGuideCard {
  productID: number
  productConditionID: number
  condition: string
  game: string
  isSupplemental: boolean
  lowPrice: number | null
  marketPrice: number | null
  number: string | null
  printing: string
  productName: string
  rarity: string | null
  sales: number
  set: string
  setAbbrv: string
  type: string
}

export class TcgplayerError extends Error {
  readonly status: number | null
  readonly timedOut: boolean

  constructor(
    message: string,
    { status = null, timedOut = false }: { status?: number | null; timedOut?: boolean } = {},
  ) {
    super(message)
    this.name = 'TcgplayerError'
    this.status = status
    this.timedOut = timedOut
  }
}

const getJson = async <T>(url: string): Promise<T> => {
  let response: Response
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === 'TimeoutError'
    throw new TcgplayerError(`Fallo la petición a ${url}`, { timedOut })
  }

  if (!response.ok) {
    throw new TcgplayerError(`TCGplayer respondió ${response.status} para ${url}`, {
      status: response.status,
    })
  }

  return (await response.json()) as T
}

export const fetchSetNames = async (categoryId: number) => {
  const mpfev = process.env.TCGPLAYER_MPFEV ?? DEFAULT_MPFEV
  const data = await getJson<{ results?: RawSetName[] }>(
    `${CATALOG_API}/SetNames?categoryId=${categoryId}&active=true&mpfev=${mpfev}`,
  )
  return data.results ?? []
}

// Un setId inexistente responde 200 con `{}`, por eso `null` indica set no encontrado.
export const fetchPriceGuideCards = async (setId: number, productTypeId: number | null = null) => {
  const productType = productTypeId === null ? '' : `&productTypeID=${productTypeId}`
  const data = await getJson<{ result?: RawPriceGuideCard[] }>(
    `${PRICE_GUIDE_API}/set/${setId}/cards/?rows=${PRICE_GUIDE_MAX_ROWS}${productType}`,
  )
  return data.result ?? null
}

export const productImageUrl = (productId: number) =>
  `${CDN_PRODUCT_IMAGE}/${productId}_in_400x400.jpg`
