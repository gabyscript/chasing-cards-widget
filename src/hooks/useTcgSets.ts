import { getTcgSets } from '@/services/api'
import { useApiResource } from './useApiResource'

export const useTcgSets = (tcgId: number | null) =>
  useApiResource(tcgId === null ? null : String(tcgId), (signal) =>
    getTcgSets(tcgId as number, signal),
  )
