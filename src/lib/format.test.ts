import { formatPrice } from './format'

describe('formatPrice', () => {
  it('formatea con dos decimales y símbolo de moneda', () => {
    expect(formatPrice(12.5)).toBe('$12.50')
    expect(formatPrice(0.28)).toBe('$0.28')
  })

  it('agrega separador de miles', () => {
    expect(formatPrice(1234.5)).toBe('$1,234.50')
  })

  it('respeta el locale indicado', () => {
    expect(formatPrice(1234.5, 'USD', 'es-CL')).toMatch(/1\.234,50/)
  })
})
