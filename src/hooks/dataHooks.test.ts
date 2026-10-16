import { act, renderHook } from '@testing-library/react'
import { useChasingCards } from './useChasingCards'
import { useTcgSets } from './useTcgSets'

const fetchMock = vi.fn<typeof fetch>()
const flush = () => act(() => vi.advanceTimersByTimeAsync(0))

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  fetchMock.mockImplementation(async () => Response.json([]))
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const calledUrls = () => fetchMock.mock.calls.map(([url]) => String(url))

describe('useTcgSets', () => {
  it('no consulta sin TCG seleccionado', async () => {
    const { result } = renderHook(() => useTcgSets(null))
    await flush()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.loading).toBe(false)
  })

  it('consulta los sets al elegir un TCG', async () => {
    const { result } = renderHook(() => useTcgSets(3))
    await flush()

    expect(calledUrls()).toEqual(['/api/tcg-sets?tcg=3'])
    expect(result.current.data).toEqual([])
  })
})

describe('useChasingCards', () => {
  it('consulta las cartas y refresca cada `refresh` minutos', async () => {
    renderHook(() => useChasingCards({ setId: 604, total: 5, refresh: 5 }))
    await flush()
    expect(calledUrls()).toEqual(['/api/chasing-cards?setId=604&total=5'])

    await act(() => vi.advanceTimersByTimeAsync(5 * 60_000))
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('no refresca con refresh = 0', async () => {
    renderHook(() => useChasingCards({ setId: 604, total: 5, refresh: 0 }))
    await flush()

    await act(() => vi.advanceTimersByTimeAsync(60 * 60_000))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('vuelve a consultar al cambiar la cantidad de cartas', async () => {
    const { rerender } = renderHook(
      (total: number) => useChasingCards({ setId: 604, total, refresh: 0 }),
      {
        initialProps: 5,
      },
    )
    await flush()

    rerender(10)
    await flush()

    expect(calledUrls()).toEqual([
      '/api/chasing-cards?setId=604&total=5',
      '/api/chasing-cards?setId=604&total=10',
    ])
  })
})
