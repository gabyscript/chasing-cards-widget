import { getChasingCards } from '@/services/api'
import type { WidgetConfig } from '@/types'
import { useApiResource } from './useApiResource'

const MINUTE_MS = 60_000
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000]

export const useChasingCards = ({
  setId,
  total,
  refresh,
}: Pick<WidgetConfig, 'setId' | 'total' | 'refresh'>) =>
  useApiResource(`${setId}:${total}`, (signal) => getChasingCards({ setId, total }, signal), {
    refreshMs: refresh * MINUTE_MS,
    retryDelaysMs: RETRY_DELAYS_MS,
  })
