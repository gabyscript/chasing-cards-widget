import { render, screen } from '@testing-library/react'
import { installFakeTextLayout } from '@/test/fakeTextLayout'
import FitText from './FitText'
import { findLargestFit } from './findLargestFit'

describe('findLargestFit', () => {
  it('devuelve el máximo si cabe', () => {
    expect(findLargestFit(10, 22, () => true)).toEqual({ fontSize: 22, truncated: false })
  })

  it('devuelve el mayor tamaño que cabe', () => {
    expect(findLargestFit(10, 22, (size) => size <= 15)).toEqual({
      fontSize: 15,
      truncated: false,
    })
  })

  it('marca truncado si ni el mínimo cabe', () => {
    expect(findLargestFit(10, 22, () => false)).toEqual({ fontSize: 10, truncated: true })
  })

  it('funciona con mínimo igual a máximo', () => {
    expect(findLargestFit(12, 12, () => true)).toEqual({ fontSize: 12, truncated: false })
  })
})

describe('FitText', () => {
  const renderFitText = (text: string, onFit = vi.fn()) => {
    render(
      <FitText
        as="h1"
        text={text}
        width={212}
        height={56}
        maxFontSize={22}
        minFontSize={12}
        lineHeight={1.1}
        onFit={onFit}
      />,
    )
    return { box: screen.getByRole('heading'), onFit }
  }

  beforeEach(() => {
    installFakeTextLayout()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('usa el tamaño máximo con textos cortos', () => {
    const { box, onFit } = renderFitText('Top hits LOB')

    expect(box).toHaveStyle({ fontSize: '22px' })
    expect(onFit).toHaveBeenLastCalledWith({ fontSize: 22, truncated: false })
  })

  it('reduce la letra hasta que el texto completo quepa', () => {
    const { box, onFit } = renderFitText("Top hits Pharaoh's Servant (25th Anniversary Edition)")

    expect(box).toHaveStyle({ fontSize: '14px' })
    expect(onFit).toHaveBeenLastCalledWith({ fontSize: 14, truncated: false })
    expect(box.firstElementChild).not.toHaveClass('fit-text__content--clamped')
  })

  it('corta con "…" al tamaño mínimo si no cabe', () => {
    const { box, onFit } = renderFitText('x'.repeat(200))

    expect(box).toHaveStyle({ fontSize: '12px' })
    expect(onFit).toHaveBeenLastCalledWith({ fontSize: 12, truncated: true })
    expect(box.firstElementChild).toHaveClass('fit-text__content--clamped')
    expect(box.firstElementChild).toHaveStyle({ '--fit-lines': '4' })
  })

  it('vuelve a medir cuando terminan de cargar las fuentes', async () => {
    let resolveFonts = () => {}
    const fonts = {
      ready: new Promise<void>((resolve) => {
        resolveFonts = resolve
      }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts })

    const { onFit } = renderFitText('Top hits LOB')
    expect(onFit).toHaveBeenCalledTimes(1)

    resolveFonts()
    await fonts.ready
    await Promise.resolve()

    expect(onFit).toHaveBeenCalledTimes(2)
    expect(fonts.addEventListener).toHaveBeenCalledWith('loadingdone', expect.any(Function))

    Reflect.deleteProperty(document, 'fonts')
  })
})
