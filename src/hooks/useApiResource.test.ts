import { act, renderHook } from '@testing-library/react'
import { ApiRequestError } from '@/services/api'
import { useApiResource } from './useApiResource'

const flush = () => act(() => vi.advanceTimersByTimeAsync(0))
const advance = (ms: number) => act(() => vi.advanceTimersByTimeAsync(ms))

const render = (
  key: string | null,
  load: (signal: AbortSignal) => Promise<string>,
  refreshMs = 0,
) =>
  renderHook((props) => useApiResource(props.key, load, { refreshMs: props.refreshMs }), {
    initialProps: { key, refreshMs },
  })

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useApiResource', () => {
  it('no carga nada sin key', async () => {
    const load = vi.fn<(signal: AbortSignal) => Promise<string>>()
    const { result } = render(null, load)
    await flush()

    expect(load).not.toHaveBeenCalled()
    expect(result.current).toEqual({ data: null, loading: false, error: null })
  })

  it('pasa por loading y luego entrega los datos', async () => {
    const { result } = render('a', async () => 'datos')

    expect(result.current.loading).toBe(true)
    await flush()

    expect(result.current).toEqual({ data: 'datos', loading: false, error: null })
  })

  it('expone el error como ApiError', async () => {
    const { result } = render('a', async () => {
      throw new ApiRequestError('No se encontró el set.', 404)
    })
    await flush()

    expect(result.current).toEqual({
      data: null,
      loading: false,
      error: { message: 'No se encontró el set.', status: 404 },
    })
  })

  it('al cambiar la key descarta los datos anteriores y cancela la petición previa', async () => {
    const signals: AbortSignal[] = []
    const load = vi.fn(async (signal: AbortSignal) => {
      signals.push(signal)
      return `datos-${signals.length}`
    })
    const { result, rerender } = render('a', load)
    await flush()

    rerender({ key: 'b', refreshMs: 0 })

    expect(signals[0]?.aborted).toBe(true)
    expect(result.current).toEqual({ data: null, loading: true, error: null })
    await flush()
    expect(result.current.data).toBe('datos-2')
  })

  it('refresca según el intervalo sin vaciar los datos', async () => {
    let call = 0
    const { result } = render('a', async () => `datos-${++call}`, 1000)
    await flush()
    expect(result.current.data).toBe('datos-1')

    await advance(1000)
    expect(result.current).toEqual({ data: 'datos-2', loading: false, error: null })

    await advance(1000)
    expect(result.current.data).toBe('datos-3')
  })

  it('mantiene los últimos datos si falla un refresco', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockResolvedValueOnce('datos')
      .mockRejectedValueOnce(new ApiRequestError('TCGplayer caído', 502))
    const { result } = render('a', load, 1000)
    await flush()

    await advance(1000)

    expect(result.current).toEqual({
      data: 'datos',
      loading: false,
      error: { message: 'TCGplayer caído', status: 502 },
    })
  })

  it('ignora cancelaciones y deja de refrescar al desmontar', async () => {
    const load = vi.fn(async (signal: AbortSignal) => {
      await new Promise((resolve) => setTimeout(resolve, 10))
      if (signal.aborted) throw new DOMException('aborted', 'AbortError')
      return 'datos'
    })
    const { result, unmount } = render('a', load, 1000)

    unmount()
    await advance(5000)

    expect(load).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })
})

describe('useApiResource con reintentos', () => {
  const failing = (status: number) => async () => {
    throw new ApiRequestError('falló', status)
  }

  it('reintenta errores de servidor siguiendo los delays y repite el último', async () => {
    const load = vi.fn(failing(502))
    renderHook(() => useApiResource('a', load, { retryDelaysMs: [100, 300] }))
    await flush()
    expect(load).toHaveBeenCalledTimes(1)

    await advance(100)
    expect(load).toHaveBeenCalledTimes(2)

    await advance(299)
    expect(load).toHaveBeenCalledTimes(2)
    await advance(1)
    expect(load).toHaveBeenCalledTimes(3)

    await advance(300)
    expect(load).toHaveBeenCalledTimes(4)
  })

  it('no reintenta errores del cliente', async () => {
    const load = vi.fn(failing(404))
    renderHook(() => useApiResource('a', load, { retryDelaysMs: [100] }))
    await flush()

    await advance(10_000)
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('vuelve al primer delay después de un éxito', async () => {
    const load = vi
      .fn<(signal: AbortSignal) => Promise<string>>()
      .mockRejectedValueOnce(new ApiRequestError('x', 0))
      .mockRejectedValueOnce(new ApiRequestError('x', 0))
      .mockResolvedValueOnce('ok')
      .mockRejectedValueOnce(new ApiRequestError('x', 0))
      .mockResolvedValue('ok')
    renderHook(() => useApiResource('a', load, { refreshMs: 10_000, retryDelaysMs: [100, 500] }))
    await flush()
    await advance(100)
    await advance(500)
    expect(load).toHaveBeenCalledTimes(3)

    await advance(10_000 - 600)
    expect(load).toHaveBeenCalledTimes(4)
    await advance(100)
    expect(load).toHaveBeenCalledTimes(5)
  })

  it('cancela los reintentos pendientes al desmontar', async () => {
    const load = vi.fn(failing(500))
    const { unmount } = renderHook(() => useApiResource('a', load, { retryDelaysMs: [100] }))
    await flush()

    unmount()
    await advance(1000)

    expect(load).toHaveBeenCalledTimes(1)
  })
})
