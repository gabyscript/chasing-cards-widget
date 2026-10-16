import { useEffect, useEffectEvent, useState } from 'react'
import { isAbortError, isRetryableError, toApiError } from '@/services/api'
import type { ApiError } from '@/types'

export interface ApiResource<T> {
  data: T | null
  loading: boolean
  error: ApiError | null
}

export interface ApiResourceOptions {
  refreshMs?: number
  retryDelaysMs?: readonly number[]
}

interface SettledState<T> {
  key: string | null
  data: T | null
  error: ApiError | null
}

export const useApiResource = <T>(
  key: string | null,
  load: (signal: AbortSignal) => Promise<T>,
  { refreshMs = 0, retryDelaysMs = [] }: ApiResourceOptions = {},
): ApiResource<T> => {
  const [settled, setSettled] = useState<SettledState<T>>({ key: null, data: null, error: null })
  const onLoad = useEffectEvent(load)
  const retryDelaysKey = retryDelaysMs.join(',')

  useEffect(() => {
    if (key === null) return

    const controller = new AbortController()
    const retryDelays = retryDelaysKey ? retryDelaysKey.split(',').map(Number) : []
    let failedAttempts = 0
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const scheduleRetry = () => {
      const delay = retryDelays[Math.min(failedAttempts, retryDelays.length - 1)]
      if (delay === undefined) return
      failedAttempts += 1
      clearTimeout(retryTimer)
      retryTimer = setTimeout(run, delay)
    }

    const run = async () => {
      try {
        const data = await onLoad(controller.signal)
        failedAttempts = 0
        setSettled({ key, data, error: null })
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return
        const apiError = toApiError(error)
        setSettled((previous) => ({
          key,
          data: previous.key === key ? previous.data : null,
          error: apiError,
        }))
        if (isRetryableError(apiError)) scheduleRetry()
      }
    }

    void run()
    const refreshTimer = refreshMs > 0 ? setInterval(run, refreshMs) : undefined

    return () => {
      controller.abort()
      clearInterval(refreshTimer)
      clearTimeout(retryTimer)
    }
  }, [key, refreshMs, retryDelaysKey])

  const isCurrent = key !== null && settled.key === key

  return {
    data: isCurrent ? settled.data : null,
    loading: key !== null && !isCurrent,
    error: isCurrent ? settled.error : null,
  }
}
