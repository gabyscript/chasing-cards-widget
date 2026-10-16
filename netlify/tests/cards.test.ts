import { selectTopCards, toTcgSets } from '../lib/cards.ts'
import type { RawPriceGuideCard, RawSetName } from '../lib/tcgplayer.ts'
import priceGuide from './fixtures/priceguide-base-set.json'
import setNames from './fixtures/set-names-pokemon.json'

const rawCards = priceGuide.result as RawPriceGuideCard[]

const rawCard = (overrides: Partial<RawPriceGuideCard>): RawPriceGuideCard => ({
  ...rawCards[0]!,
  ...overrides,
})

describe('selectTopCards', () => {
  it('devuelve las cartas más caras del set real, una por producto', () => {
    const cards = selectTopCards(rawCards, { total: 5 })

    expect(cards.map((card) => card.productId)).toEqual([42382, 42360, 42355, 42347, 42346])
    expect(new Set(cards.map((card) => card.productId)).size).toBe(cards.length)
  })

  it('usa el mayor marketPrice entre las condiciones de un mismo producto', () => {
    const [first] = selectTopCards(rawCards, { total: 1 })
    const prices = rawCards.filter((c) => c.productID === 42382).map((c) => c.marketPrice ?? 0)

    expect(first?.marketPrice).toBe(Math.max(...prices))
  })

  it('mapea al DTO con imagen del CDN de TCGplayer', () => {
    const [first] = selectTopCards(rawCards, { total: 1 })

    expect(first).toEqual({
      productId: 42382,
      name: expect.any(String),
      setName: 'Base Set',
      number: expect.any(String),
      rarity: expect.any(String),
      marketPrice: 954.65,
      imageUrl: 'https://tcgplayer-cdn.tcgplayer.com/product/42382_in_400x400.jpg',
    })
  })

  it('descarta cartas sin precio o con precio 0', () => {
    const cards = selectTopCards(
      [
        rawCard({ productID: 1, marketPrice: null }),
        rawCard({ productID: 2, marketPrice: 0 }),
        rawCard({ productID: 3, marketPrice: 4 }),
      ],
      { total: 5 },
    )

    expect(cards.map((card) => card.productId)).toEqual([3])
  })

  it('filtra por precio mínimo', () => {
    const cards = selectTopCards(rawCards, { total: 15, minPrice: 100 })

    expect(cards.map((card) => card.productId)).toEqual([42382, 42360, 42355])
  })

  it('normaliza number y rarity vacíos a null', () => {
    const [card] = selectTopCards([rawCard({ productID: 9, number: '', rarity: '' })], {
      total: 1,
    })

    expect(card).toMatchObject({ number: null, rarity: null })
  })
})

describe('toTcgSets', () => {
  it('ordena del más reciente al más antiguo y desempata por nombre', () => {
    const sets = toTcgSets(setNames.results as RawSetName[])

    expect(sets.map((set) => set.setNameId)).toEqual([23651, 609, 605, 604, 1663])
  })

  it('deja al final los sets sin fecha y no expone campos internos', () => {
    const [dated, undated] = toTcgSets([
      { ...(setNames.results[0] as RawSetName), setNameId: 1, releaseDate: null },
      { ...(setNames.results[0] as RawSetName), setNameId: 2 },
    ])

    expect([dated?.setNameId, undated?.setNameId]).toEqual([2, 1])
    expect(Object.keys(dated ?? {})).not.toContain('urlName')
  })
})
