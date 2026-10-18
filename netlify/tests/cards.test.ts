import { conditionRank, selectTopCards, toTcgSets } from '../lib/cards.ts'
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

  it('prioriza Near Mint aunque una condición peor tenga mayor precio', () => {
    const [card] = selectTopCards(
      [
        rawCard({ productID: 1, printing: 'Normal', condition: 'Damaged', marketPrice: 200 }),
        rawCard({ productID: 1, printing: 'Normal', condition: 'Near Mint', marketPrice: 140 }),
      ],
      { total: 1 },
    )

    expect(card?.marketPrice).toBe(140)
  })

  it('sin Near Mint usa la siguiente mejor condición disponible', () => {
    const [card] = selectTopCards(
      [
        rawCard({ productID: 1, printing: 'Normal', condition: 'Damaged', marketPrice: 90 }),
        rawCard({ productID: 1, printing: 'Normal', condition: 'Lightly Played', marketPrice: 60 }),
      ],
      { total: 1 },
    )

    expect(card?.marketPrice).toBe(60)
  })

  it('ignora una condición sin precio y pasa a la siguiente', () => {
    const [card] = selectTopCards(
      [
        rawCard({ productID: 1, printing: 'Normal', condition: 'Near Mint', marketPrice: null }),
        rawCard({ productID: 1, printing: 'Normal', condition: 'Heavily Played', marketPrice: 30 }),
        rawCard({
          productID: 1,
          printing: 'Normal',
          condition: 'Moderately Played',
          marketPrice: 25,
        }),
      ],
      { total: 1 },
    )

    expect(card?.marketPrice).toBe(25)
  })

  it('aplica la prioridad por printing y muestra el printing más caro', () => {
    const [card] = selectTopCards(
      [
        rawCard({ productID: 1, printing: 'Normal', condition: 'Near Mint', marketPrice: 2 }),
        rawCard({
          productID: 1,
          printing: 'Reverse Holofoil',
          condition: 'Lightly Played Reverse Holofoil',
          marketPrice: 8,
        }),
        rawCard({
          productID: 1,
          printing: 'Reverse Holofoil',
          condition: 'Damaged Reverse Holofoil',
          marketPrice: 20,
        }),
      ],
      { total: 1 },
    )

    expect(card?.marketPrice).toBe(8)
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

describe('conditionRank', () => {
  it('ordena de Near Mint a Damaged ignorando el sufijo de printing', () => {
    const conditions = [
      'Near Mint Holofoil',
      'Lightly Played',
      'Moderately Played Reverse Holofoil',
      'Heavily Played',
      'Damaged Holofoil',
    ]

    expect(conditions.map(conditionRank)).toEqual([0, 1, 2, 3, 4])
  })

  it('deja al final las condiciones desconocidas', () => {
    expect(conditionRank('Unopened')).toBeGreaterThan(conditionRank('Damaged'))
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
