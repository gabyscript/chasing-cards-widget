import { TCGS } from '../../src/constants/tcgs.ts'
import { cardsProductTypeId } from '../lib/tcgplayer.ts'

describe('cardsProductTypeId', () => {
  it.each(TCGS.map((tcg) => [tcg.id, tcg.productTypeId]))(
    'devuelve el productTypeID de cartas del TCG %i',
    (categoryId, expected) => {
      expect(cardsProductTypeId(categoryId)).toBe(expected)
    },
  )

  it('usa los valores confirmados contra la API', () => {
    expect([3, 63, 68, 71, 80].map(cardsProductTypeId)).toEqual([1, 103, 110, 116, 134])
  })

  it.each([86, null])('devuelve null para un TCG no soportado o ausente (%s)', (categoryId) => {
    expect(cardsProductTypeId(categoryId)).toBeNull()
  })
})
