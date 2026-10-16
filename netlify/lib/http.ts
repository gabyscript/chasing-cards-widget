import { TcgplayerError } from './tcgplayer.ts'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export const cacheHeaders = (browserSeconds: number, cdnSeconds: number) => ({
  'Cache-Control': `public, max-age=${browserSeconds}`,
  'Netlify-CDN-Cache-Control': `public, durable, s-maxage=${cdnSeconds}, stale-while-revalidate=${cdnSeconds}`,
})

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers: { ...CORS_HEADERS, ...headers } })

export const errorResponse = (message: string, status: number) => json({ message, status }, status)

export class HttpError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpError'
    this.status = status
  }
}

const toErrorResponse = (error: unknown) => {
  if (error instanceof HttpError) return errorResponse(error.message, error.status)
  if (error instanceof TcgplayerError) {
    return error.timedOut
      ? errorResponse('TCGplayer no respondió a tiempo.', 504)
      : errorResponse('No se pudo obtener la información desde TCGplayer.', 502)
  }
  console.error(error)
  return errorResponse('Error interno del servidor.', 500)
}

export const handleGet =
  (handler: (params: URLSearchParams) => Promise<Response>) => async (request: Request) => {
    if (request.method === 'OPTIONS')
      return new Response(null, { status: 204, headers: CORS_HEADERS })
    if (request.method !== 'GET') return errorResponse('Método no permitido.', 405)

    try {
      return await handler(new URL(request.url).searchParams)
    } catch (error) {
      return toErrorResponse(error)
    }
  }

export const requirePositiveInteger = (params: URLSearchParams, name: string) => {
  const raw = params.get(name)?.trim()
  if (!raw || !/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw new HttpError(`El parámetro ${name} es obligatorio y debe ser un número positivo.`, 400)
  }
  return Number(raw)
}

export const optionalNumber = (params: URLSearchParams, name: string) => {
  const raw = params.get(name)?.trim()
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value)) {
    throw new HttpError(`El parámetro ${name} debe ser numérico.`, 400)
  }
  return value
}
