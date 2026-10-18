import { WIDGET_LIMITS } from '../../src/lib/widgetConfig.ts'
import type { ChasingCardsResponse } from '../../src/types/index.ts'
import { selectTopCards } from '../lib/cards.ts'
import {
  cacheHeaders,
  HttpError,
  handleGet,
  json,
  optionalNumber,
  requirePositiveInteger,
} from '../lib/http.ts'
import { cardsProductTypeId, fetchPriceGuideCards } from '../lib/tcgplayer.ts'

const FIVE_MINUTES = 5 * 60
const THIRTY_MINUTES = 30 * 60

const clampTotal = (value: number | null) => {
  const { min, max } = WIDGET_LIMITS.total
  return Math.min(Math.max(Math.round(value ?? min), min), max)
}

export default handleGet(async (params) => {
  const setId = requirePositiveInteger(params, 'setId')
  const total = clampTotal(optionalNumber(params, 'total') ?? optionalNumber(params, 'totalCards'))
  const minPrice = optionalNumber(params, 'minPrice')
  const tcg = optionalNumber(params, 'tcg')

  const rawCards = await fetchPriceGuideCards(setId, cardsProductTypeId(tcg))
  if (rawCards === null) {
    throw new HttpError(`No se encontró el set ${setId}.`, 404)
  }

  const body: ChasingCardsResponse = {
    setName: rawCards[0]?.set ?? '',
    setCode: rawCards[0]?.setAbbrv || null,
    updatedAt: new Date().toISOString(),
    cards: selectTopCards(rawCards, { total, minPrice }),
  }

  return json(body, 200, cacheHeaders(FIVE_MINUTES, THIRTY_MINUTES))
})
