// @vitest-environment node
import chasingCards from '../functions/chasing-cards.mts'
import health from '../functions/health.mts'
import tcgSets from '../functions/tcg-sets.mts'
import priceGuide from './fixtures/priceguide-base-set.json'
import setNames from './fixtures/set-names-pokemon.json'

const fetchMock = vi.fn<typeof fetch>()

const request = (path: string, method = 'GET') =>
  new Request(`https://widget.test/.netlify/functions/${path}`, { method })

const mockTcgplayer = (body: unknown, status = 200) =>
  fetchMock.mockResolvedValueOnce(Response.json(body, { status }))

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('tcg-sets', () => {
  it('devuelve los sets del TCG con CORS y caché', async () => {
    mockTcgplayer(setNames)

    const response = await tcgSets(request('tcg-sets?tcg=3'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    expect(response.headers.get('Cache-Control')).toContain('max-age=3600')
    expect(body).toHaveLength(setNames.results.length)
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('categoryId=3')
  })

  it.each(['tcg-sets', 'tcg-sets?tcg=abc', 'tcg-sets?tcg=0'])(
    'responde 400 con tcg inválido: %s',
    async (path) => {
      const response = await tcgSets(request(path))

      expect(response.status).toBe(400)
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('responde 405 a métodos distintos de GET', async () => {
    expect((await tcgSets(request('tcg-sets?tcg=3', 'POST'))).status).toBe(405)
  })

  it('responde 204 al preflight OPTIONS', async () => {
    expect((await tcgSets(request('tcg-sets', 'OPTIONS'))).status).toBe(204)
  })
})

describe('chasing-cards', () => {
  it('devuelve el top de cartas del set', async () => {
    mockTcgplayer(priceGuide)

    const response = await chasingCards(request('chasing-cards?setId=604&total=6'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.setName).toBe('Base Set')
    expect(body.setCode).toBe('BS')
    expect(body.cards).toHaveLength(6)
    expect(Date.parse(body.updatedAt)).not.toBeNaN()
    expect(response.headers.get('Netlify-CDN-Cache-Control')).toContain('s-maxage=1800')
  })

  it.each([
    ['total=99', 12],
    ['total=1', 5],
    ['totalCards=7', 7],
    ['', 5],
  ])('acota la cantidad de cartas (%s → %i)', async (query, expected) => {
    mockTcgplayer(priceGuide)

    const response = await chasingCards(request(`chasing-cards?setId=604&${query}`))
    const body = await response.json()

    expect(body.cards).toHaveLength(Math.min(expected, 12))
  })

  it('aplica minPrice', async () => {
    mockTcgplayer(priceGuide)

    const response = await chasingCards(request('chasing-cards?setId=604&minPrice=100'))
    const body = await response.json()

    expect(body.cards).toHaveLength(3)
  })

  it('responde 404 cuando TCGplayer no conoce el set', async () => {
    mockTcgplayer({})

    const response = await chasingCards(request('chasing-cards?setId=999999'))

    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ status: 404 })
  })

  it.each(['chasing-cards', 'chasing-cards?setId=x', 'chasing-cards?setId=1&minPrice=abc'])(
    'responde 400 con parámetros inválidos: %s',
    async (path) => {
      expect((await chasingCards(request(path))).status).toBe(400)
    },
  )

  it('responde 502 con CORS cuando TCGplayer falla', async () => {
    mockTcgplayer({ error: 'boom' }, 503)

    const response = await chasingCards(request('chasing-cards?setId=604'))

    expect(response.status).toBe(502)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
  })

  it('responde 504 cuando TCGplayer no responde a tiempo', async () => {
    fetchMock.mockRejectedValueOnce(new DOMException('timeout', 'TimeoutError'))

    const response = await chasingCards(request('chasing-cards?setId=604'))

    expect(response.status).toBe(504)
  })

  it('responde 500 ante errores inesperados', async () => {
    fetchMock.mockResolvedValueOnce(new Response('no es json'))

    const response = await chasingCards(request('chasing-cards?setId=604'))

    expect(response.status).toBe(500)
  })
})

describe('health', () => {
  it('responde ok con timestamp', async () => {
    const response = await health()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.status).toBe('ok')
    expect(Date.parse(body.timestamp)).not.toBeNaN()
  })
})
