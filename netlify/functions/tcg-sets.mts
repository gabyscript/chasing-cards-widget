import { toTcgSets } from '../lib/cards.ts'
import { cacheHeaders, handleGet, json, requirePositiveInteger } from '../lib/http.ts'
import { fetchSetNames } from '../lib/tcgplayer.ts'

const ONE_HOUR = 60 * 60

export default handleGet(async (params) => {
  const tcg = requirePositiveInteger(params, 'tcg')
  const sets = toTcgSets(await fetchSetNames(tcg))
  return json(sets, 200, cacheHeaders(ONE_HOUR, ONE_HOUR * 6))
})
