import type { ChasingCard, ChasingCardsResponse } from '@/types'

export const makeCard = (productId: number, overrides: Partial<ChasingCard> = {}): ChasingCard => ({
  productId,
  name: `Carta ${productId}`,
  setName: 'Base Set',
  number: `${productId}/102`,
  rarity: 'Holo Rare',
  marketPrice: productId * 10,
  imageUrl: `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_in_400x400.jpg`,
  ...overrides,
})

export const makeResponse = (cards: ChasingCard[]): ChasingCardsResponse => ({
  setName: 'Base Set',
  setCode: 'BS',
  updatedAt: '2026-10-15T00:00:00.000Z',
  cards,
})
