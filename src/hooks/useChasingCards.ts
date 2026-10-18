import { getChasingCards } from '@/services/api'
import type { WidgetConfig } from '@/types'
import { useApiResource } from './useApiResource'

const MINUTE_MS = 60_000
const RETRY_DELAYS_MS = [5_000, 15_000, 30_000, 60_000]

export const useChasingCards = ({
  setId,
  tcg = null,
  total,
  refresh,
}: Pick<WidgetConfig, 'setId' | 'total' | 'refresh'> & Partial<Pick<WidgetConfig, 'tcg'>>) =>
  useApiResource(
    `${setId}:${tcg}:${total}`,
    (signal) => getChasingCards({ setId, tcg, total }, signal),
    { refreshMs: refresh * MINUTE_MS, retryDelaysMs: RETRY_DELAYS_MS },
  )
