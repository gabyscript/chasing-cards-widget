import { useEffect, useState } from 'react'
import type { TcgSet, WidgetSettings } from '@/types'
import {
  CONFIG_FIELDS,
  type ConfigErrors,
  type ConfigField,
  loadFormState,
  saveFormState,
  toWidgetConfig,
  validateConfigForm,
} from './configForm'

const isConfigField = (key: string): key is ConfigField =>
  (CONFIG_FIELDS as readonly string[]).includes(key)

export const useConfigForm = () => {
  const [state, setState] = useState(loadFormState)
  const [touched, setTouched] = useState<ReadonlySet<ConfigField>>(new Set())

  useEffect(() => {
    saveFormState(state)
  }, [state])

  const touch = (...fields: ConfigField[]) =>
    setTouched((previous) => new Set([...previous, ...fields]))

  const updateSettings = (patch: Partial<WidgetSettings>) => {
    setState((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }))
    touch(...Object.keys(patch).filter(isConfigField))
  }

  const selectTcg = (tcg: number | null) => {
    setState((previous) => ({ settings: { ...previous.settings, tcg }, set: null }))
    touch('tcg')
  }

  const selectSet = (set: TcgSet | null) => {
    setState((previous) => ({ ...previous, set }))
    touch('set')
  }

  const errors = validateConfigForm(state)
  const visibleErrors: ConfigErrors = Object.fromEntries(
    Object.entries(errors).filter(([field]) => touched.has(field as ConfigField)),
  )

  return {
    state,
    errors,
    visibleErrors,
    config: toWidgetConfig(state),
    updateSettings,
    selectTcg,
    selectSet,
    touch,
  }
}
