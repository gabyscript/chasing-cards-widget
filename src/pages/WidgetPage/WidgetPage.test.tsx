import { act, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { makeCard, makeResponse } from '@/test/fixtures'
import WidgetPage from './WidgetPage'

const fetchMock = vi.fn<typeof fetch>()
const flush = () => act(() => vi.advanceTimersByTimeAsync(0))

const renderWidget = (query: string) =>
  render(
    <MemoryRouter initialEntries={[`/widget?${query}`]}>
      <Routes>
        <Route path="/widget" element={<WidgetPage />} />
      </Routes>
    </MemoryRouter>,
  )

const mockCards = (cards = [makeCard(1), makeCard(2)]) =>
  fetchMock.mockImplementation(async () => Response.json(makeResponse(cards)))

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('WidgetPage', () => {
  it('muestra un aviso con un link inválido', () => {
    renderWidget('total=5')

    expect(screen.getByText(/Link de widget inválido/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('pide las cartas con la config del link y muestra título y primera carta', async () => {
    mockCards()
    renderWidget('setId=604&total=8&title=Lo%20mejor%20de%20%7Bset%7D')
    await flush()

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/chasing-cards?setId=604&total=8')
    expect(screen.getByRole('heading', { name: 'Lo mejor de Base Set' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Carta 1' })).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
  })

  it('usa el código del set con {code}', async () => {
    mockCards()
    renderWidget('setId=604&title=Top%20hits%20%7Bcode%7D')
    await flush()

    expect(screen.getByRole('heading', { name: 'Top hits BS' })).toBeInTheDocument()
  })

  it('acepta los links del widget original de stream-widgets', async () => {
    mockCards()
    renderWidget('totalCards=10&setId=23651&textColor=black')
    await flush()

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe('/api/chasing-cards?setId=23651&total=10')
  })

  it('oculta título, nombre y precio según los flags', async () => {
    mockCards()
    renderWidget('setId=604&showTitle=0&showPrice=0')
    await flush()

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByText('$10.00')).not.toBeInTheDocument()
  })

  it('aplica el color de texto y el ancho de carta como variables CSS', async () => {
    mockCards()
    const { container } = renderWidget('setId=604&textColor=%23ff8800&cardWidth=200')
    await flush()

    const widget = container.querySelector<HTMLElement>('.widget-view')!
    expect(widget.style.getPropertyValue('--text-color')).toBe('#ff8800')
    expect(widget.style.getPropertyValue('--card-width')).toBe('200px')
    expect(widget.style.getPropertyValue('--card-height')).toBe('280px')
    expect(widget.style.getPropertyValue('--title-gap')).toBe('12px')
  })

  it('deja el fondo transparente mientras está montado', () => {
    mockCards()
    const { unmount } = renderWidget('setId=604')

    expect(document.documentElement).toHaveClass('widget-transparent')
    unmount()
    expect(document.documentElement).not.toHaveClass('widget-transparent')
  })

  it('avisa cuando el set no tiene cartas con precio', async () => {
    mockCards([])
    renderWidget('setId=604')
    await flush()

    expect(screen.getByText('Este set no tiene cartas con precio.')).toBeInTheDocument()
  })

  it('muestra el error de la API sin reintentar si el set no existe', async () => {
    fetchMock.mockImplementation(async () =>
      Response.json({ message: 'No se encontró el set 9.', status: 404 }, { status: 404 }),
    )
    renderWidget('setId=9')
    await flush()

    expect(screen.getByText('No se encontró el set 9.')).toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(120_000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reintenta con backoff si TCGplayer falla y se recupera solo', async () => {
    fetchMock
      .mockImplementationOnce(async () =>
        Response.json({ message: 'x', status: 502 }, { status: 502 }),
      )
      .mockImplementationOnce(async () =>
        Response.json({ message: 'x', status: 502 }, { status: 502 }),
      )
      .mockImplementation(async () => Response.json(makeResponse([makeCard(1)])))
    renderWidget('setId=604')
    await flush()

    expect(screen.getByText('No se pudo conectar con TCGplayer. Reintentando…')).toBeInTheDocument()

    await act(() => vi.advanceTimersByTimeAsync(5_000))
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await act(() => vi.advanceTimersByTimeAsync(15_000))
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('img', { name: 'Carta 1' })).toBeInTheDocument()
    expect(screen.queryByText(/Reintentando/)).not.toBeInTheDocument()
  })

  it('mantiene las cartas visibles si falla un refresco', async () => {
    fetchMock
      .mockImplementationOnce(async () => Response.json(makeResponse([makeCard(1)])))
      .mockImplementation(async () => Response.json({ message: 'x', status: 503 }, { status: 503 }))
    renderWidget('setId=604&refresh=5')
    await flush()

    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000))

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('img', { name: 'Carta 1' })).toBeInTheDocument()
    expect(screen.queryByText(/Reintentando/)).not.toBeInTheDocument()
  })
})
