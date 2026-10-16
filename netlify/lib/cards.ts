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

export const selectTopCards = (
  rawCards: RawPriceGuideCard[],
  { total, minPrice = null }: SelectTopCardsOptions,
): ChasingCard[] => {
  const mostValuableByProduct = new Map<number, PricedCard>()

  for (const card of rawCards) {
    if (!hasPrice(card)) continue
    const current = mostValuableByProduct.get(card.productID)
    if (!current || card.marketPrice > current.marketPrice) {
      mostValuableByProduct.set(card.productID, card)
    }
  }

  return [...mostValuableByProduct.values()]
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
