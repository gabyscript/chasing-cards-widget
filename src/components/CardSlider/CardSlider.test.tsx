import { act, render, screen } from '@testing-library/react'
import { makeCard } from '@/test/fixtures'
import type { AnimationType, ChasingCard } from '@/types'
import CardSlider from './CardSlider'

const cards = [makeCard(1), makeCard(2), makeCard(3)]

const renderSlider = (items: ChasingCard[], duration = 3, animation: AnimationType = 'slide') =>
  render(
    <CardSlider
      cards={items}
      duration={duration}
      animation={animation}
      renderCard={(card) => <span>{card.name}</span>}
    />,
  )

const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

const visibleCard = () => screen.getByText(/^Carta \d+$/).textContent

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CardSlider', () => {
  it('rota las cartas según la duración y vuelve al inicio', async () => {
    renderSlider(cards, 3)
    expect(visibleCard()).toBe('Carta 1')

    await advance(3000)
    expect(visibleCard()).toBe('Carta 2')

    await advance(3000)
    expect(visibleCard()).toBe('Carta 3')

    await advance(3000)
    expect(visibleCard()).toBe('Carta 1')
  })

  it('respeta un cambio de duración', async () => {
    const { rerender } = renderSlider(cards, 3)

    rerender(
      <CardSlider
        cards={cards}
        duration={10}
        animation="slide"
        renderCard={(card) => <span>{card.name}</span>}
      />,
    )
    await advance(3000)
    expect(visibleCard()).toBe('Carta 1')

    await advance(7000)
    expect(visibleCard()).toBe('Carta 2')
  })

  it('no anima ni rota con una sola carta', async () => {
    renderSlider([makeCard(7)])

    await advance(30_000)

    expect(visibleCard()).toBe('Carta 7')
    expect(screen.queryByTestId('card-slide')).not.toBeInTheDocument()
  })

  it('no reinicia la rotación cuando llega un refresco con las mismas cartas', async () => {
    const { rerender } = renderSlider(cards, 3)
    await advance(3000)
    expect(visibleCard()).toBe('Carta 2')

    rerender(
      <CardSlider
        cards={cards.map((card) => ({ ...card, marketPrice: card.marketPrice + 1 }))}
        duration={3}
        animation="slide"
        renderCard={(card) => <span>{card.name}</span>}
      />,
    )

    expect(visibleCard()).toBe('Carta 2')
    await advance(3000)
    expect(visibleCard()).toBe('Carta 3')
  })

  it('se ajusta si un refresco trae menos cartas', async () => {
    const { rerender } = renderSlider(cards, 3)
    await advance(6000)
    expect(visibleCard()).toBe('Carta 3')

    rerender(
      <CardSlider
        cards={cards.slice(0, 2)}
        duration={3}
        animation="slide"
        renderCard={(card) => <span>{card.name}</span>}
      />,
    )
    await advance(50)

    expect(visibleCard()).toBe('Carta 1')
  })

  it('precarga la imagen de la siguiente carta', () => {
    const sources: string[] = []
    vi.spyOn(window, 'Image').mockImplementation(function (this: { src: string }) {
      Object.defineProperty(this, 'src', { set: (value: string) => sources.push(value) })
      return this as unknown as HTMLImageElement
    })

    renderSlider(cards)

    expect(sources).toEqual([cards[1]!.imageUrl])
    vi.restoreAllMocks()
  })

  it.each<AnimationType>(['slide', 'fade', 'flip'])(
    'renderiza con la animación %s',
    (animation) => {
      renderSlider(cards, 3, animation)
      expect(screen.getByTestId('card-slide')).toHaveTextContent('Carta 1')
    },
  )

  it('no renderiza nada sin cartas', () => {
    const { container } = renderSlider([])
    expect(container).toBeEmptyDOMElement()
  })
})
