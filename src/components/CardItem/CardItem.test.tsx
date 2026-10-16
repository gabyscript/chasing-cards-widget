import { fireEvent, render, screen } from '@testing-library/react'
import { installFakeTextLayout } from '@/test/fakeTextLayout'
import { makeCard } from '@/test/fixtures'
import CardItem from './CardItem'

const card = makeCard(42382, { name: 'Charizard - 4/102', marketPrice: 954.65 })

describe('CardItem', () => {
  it('muestra la imagen y el precio formateado', () => {
    render(<CardItem card={card} cardWidth={180} showName={false} showPrice currency="USD" />)

    expect(screen.getByRole('img', { name: 'Charizard - 4/102' })).toHaveAttribute(
      'src',
      card.imageUrl,
    )
    expect(screen.getByText('$954.65')).toBeInTheDocument()
    expect(screen.queryByText('Charizard - 4/102')).not.toBeInTheDocument()
  })

  it('muestra el nombre y oculta el precio según los flags', () => {
    render(<CardItem card={card} cardWidth={180} showName showPrice={false} currency="USD" />)

    expect(screen.getByText('Charizard - 4/102')).toBeInTheDocument()
    expect(screen.queryByText('$954.65')).not.toBeInTheDocument()
  })

  it('omite el pie cuando no se muestra ni nombre ni precio', () => {
    const { container } = render(
      <CardItem card={card} cardWidth={180} showName={false} showPrice={false} currency="USD" />,
    )
    expect(container.querySelector('figcaption')).toBeNull()
  })

  it('muestra el nombre en lugar de la imagen si esta no carga', () => {
    render(<CardItem card={card} cardWidth={180} showName={false} showPrice currency="USD" />)

    fireEvent.error(screen.getByRole('img'))

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Charizard - 4/102')).toBeInTheDocument()
  })

  it('achica la letra de nombres largos para que quepan completos', () => {
    installFakeTextLayout()
    const longName = makeCard(1, { name: 'Blue-Eyes White Dragon (25th Anniversary) - LOB-001' })

    render(<CardItem card={longName} cardWidth={180} showName showPrice={false} currency="USD" />)

    const name = screen.getByText(longName.name).parentElement!
    expect(Number.parseFloat(name.style.fontSize)).toBeLessThan(15)
    expect(name.firstElementChild).not.toHaveClass('fit-text__content--clamped')
    vi.restoreAllMocks()
  })
})
