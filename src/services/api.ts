import type { ApiError, ChasingCardsResponse, TcgSet } from '@/types'

const API_BASE = '/api'

export class ApiRequestError extends Error implements ApiError {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === 'AbortError'

const isApiErrorBody = (body: unknown): body is ApiError =>
  typeof body === 'object' &&
  body !== null &&
  typeof (body as ApiError).message === 'string' &&
  typeof (body as ApiError).status === 'number'

export const isRetryableError = (error: ApiError) => error.status === 0 || error.status >= 500

export const toApiError = (error: unknown): ApiError =>
  error instanceof ApiRequestError
    ? { message: error.message, status: error.status }
    : { message: 'Ocurrió un error inesperado.', status: 0 }

const request = async <T>(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<T> => {
  let response: Response
  try {
    response = await fetch(`${API_BASE}/${path}?${new URLSearchParams(params)}`, { signal })
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new ApiRequestError('No se pudo conectar con el servidor.', 0)
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null)
    throw new ApiRequestError(
      isApiErrorBody(body) ? body.message : `El servidor respondió con error ${response.status}.`,
      response.status,
    )
  }

  return (await response.json()) as T
}

export const getTcgSets = (tcgId: number, signal?: AbortSignal) =>
  request<TcgSet[]>('tcg-sets', { tcg: String(tcgId) }, signal)

export const getChasingCards = (
  { setId, total }: { setId: number; total: number },
  signal?: AbortSignal,
) =>
  request<ChasingCardsResponse>(
    'chasing-cards',
    { setId: String(setId), total: String(total) },
    signal,
  )
