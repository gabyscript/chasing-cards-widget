import type { ChasingCard, TcgSet } from '../../src/types/index.ts'
import { productImageUrl, type RawPriceGuideCard, type RawSetName } from './tcgplayer.ts'

type PricedCard = RawPriceGuideCard & { marketPrice: number }

interface SelectTopCardsOptions {
  total: number
  minPrice?: number | null
}

const hasPrice = (card: RawPriceGuideCard): card is PricedCard =>
  typeof card.marketPrice === 'number' && card.marketPrice > 0

const toChasingCard = (card: PricedCard): ChasingCard => ({
  productId: card.productID,
  name: card.productName,
  setName: card.set,
  number: card.number || null,
  rarity: card.rarity || null,
  marketPrice: card.marketPrice,
  imageUrl: productImageUrl(card.productID),
})

const CONDITION_PRIORITY = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
]

// `condition` trae el printing como sufijo ("Near Mint Holofoil"), por eso se compara por prefijo.
// Una condición desconocida queda al final: solo se usa si no hay otra opción.
export const conditionRank = (condition: string) => {
  const index = CONDITION_PRIORITY.findIndex((name) => condition.startsWith(name))
  return index === -1 ? CONDITION_PRIORITY.length : index
}

const isBetterCondition = (card: PricedCard, current: PricedCard) => {
  const rankDiff = conditionRank(card.condition) - conditionRank(current.condition)
  return rankDiff < 0 || (rankDiff === 0 && card.marketPrice > current.marketPrice)
}

// TCGplayer a veces trae precios incoherentes (Damaged más caro que Near Mint), así que dentro de
// cada printing manda la mejor condición disponible, y entre printings el más caro.
export const pickPreferredPrice = (cards: PricedCard[]): PricedCard | undefined => {
  const bestByPrinting = new Map<string, PricedCard>()

  for (const card of cards) {
    const current = bestByPrinting.get(card.printing)
    if (!current || isBetterCondition(card, current)) {
      bestByPrinting.set(card.printing, card)
    }
  }

  return [...bestByPrinting.values()].reduce<PricedCard | undefined>(
    (best, card) => (!best || card.marketPrice > best.marketPrice ? card : best),
    undefined,
  )
}

export const selectTopCards = (
  rawCards: RawPriceGuideCard[],
  { total, minPrice = null }: SelectTopCardsOptions,
): ChasingCard[] => {
  const pricedByProduct = new Map<number, PricedCard[]>()

  for (const card of rawCards) {
    if (!hasPrice(card)) continue
    const group = pricedByProduct.get(card.productID)
    if (group) group.push(card)
    else pricedByProduct.set(card.productID, [card])
  }

  return [...pricedByProduct.values()]
    .map(pickPreferredPrice)
    .filter((card): card is PricedCard => card !== undefined)
    .filter((card) => minPrice === null || card.marketPrice >= minPrice)
    .sort((a, b) => b.marketPrice - a.marketPrice)
    .slice(0, total)
    .map(toChasingCard)
}

const releaseTime = (set: RawSetName) => (set.releaseDate ? Date.parse(set.releaseDate) : 0)

export const toTcgSets = (rawSets: RawSetName[]): TcgSet[] =>
  [...rawSets]
    .sort((a, b) => releaseTime(b) - releaseTime(a) || a.name.localeCompare(b.name))
    .map((set) => ({
      setNameId: set.setNameId,
      categoryId: set.categoryId,
      name: set.name,
      abbreviation: set.abbreviation,
      releaseDate: set.releaseDate,
      isSupplemental: set.isSupplemental,
    }))
