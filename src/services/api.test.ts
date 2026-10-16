import { ApiRequestError, getChasingCards, getTcgSets, toApiError } from './api'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const calledUrl = () => String(fetchMock.mock.calls[0]?.[0])

describe('getTcgSets', () => {
  it('pide los sets del TCG a la function', async () => {
    const sets = [{ setNameId: 1, name: 'Base Set' }]
    fetchMock.mockResolvedValueOnce(Response.json(sets))

    await expect(getTcgSets(3)).resolves.toEqual(sets)
    expect(calledUrl()).toBe('/api/tcg-sets?tcg=3')
  })
})

describe('getChasingCards', () => {
  it('pide el top de cartas con setId y total', async () => {
    const body = { setName: 'Base Set', updatedAt: '', cards: [] }
    fetchMock.mockResolvedValueOnce(Response.json(body))

    await expect(getChasingCards({ setId: 604, total: 8 })).resolves.toEqual(body)
    expect(calledUrl()).toBe('/api/chasing-cards?setId=604&total=8')
  })

  it('propaga el signal a fetch', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({}))
    const controller = new AbortController()

    await getChasingCards({ setId: 1, total: 5 }, controller.signal)

    expect(fetchMock.mock.calls[0]?.[1]).toEqual({ signal: controller.signal })
  })
})

describe('manejo de errores', () => {
  it('usa el mensaje del cuerpo de error de la function', async () => {
    fetchMock.mockResolvedValueOnce(
      Response.json({ message: 'No se encontró el set 9.', status: 404 }, { status: 404 }),
    )

    await expect(getChasingCards({ setId: 9, total: 5 })).rejects.toMatchObject({
      name: 'ApiRequestError',
      message: 'No se encontró el set 9.',
      status: 404,
    })
  })

  it('usa un mensaje genérico si el cuerpo no es un error de la API', async () => {
    fetchMock.mockResolvedValueOnce(new Response('<html>', { status: 502 }))

    await expect(getTcgSets(3)).rejects.toMatchObject({
      message: 'El servidor respondió con error 502.',
      status: 502,
    })
  })

  it('convierte fallos de red en status 0', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    await expect(getTcgSets(3)).rejects.toMatchObject({
      message: 'No se pudo conectar con el servidor.',
      status: 0,
    })
  })

  it('deja pasar las cancelaciones sin convertirlas', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('aborted', 'AbortError'))

    await expect(getTcgSets(3)).rejects.toMatchObject({ name: 'AbortError' })
  })
})

describe('toApiError', () => {
  it('conserva mensaje y status de ApiRequestError', () => {
    expect(toApiError(new ApiRequestError('falló', 400))).toEqual({ message: 'falló', status: 400 })
  })

  it('usa un mensaje genérico para errores desconocidos', () => {
    expect(toApiError(new Error('x'))).toEqual({
      message: 'Ocurrió un error inesperado.',
      status: 0,
    })
  })
})
