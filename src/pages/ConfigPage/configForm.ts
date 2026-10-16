import {
  DEFAULT_WIDGET_CONFIG,
  parseWidgetSettings,
  toWidgetParams,
  WIDGET_LIMITS,
} from '@/lib/widgetConfig'
import type { TcgSet, WidgetConfig, WidgetSettings } from '@/types'

export interface ConfigFormState {
  settings: WidgetSettings
  set: TcgSet | null
}

export type ConfigField = 'tcg' | 'set' | 'total' | 'title'

export type ConfigErrors = Partial<Record<ConfigField, string>>

export const CONFIG_FIELDS: readonly ConfigField[] = ['tcg', 'set', 'total', 'title']

export const INITIAL_FORM_STATE: ConfigFormState = { settings: DEFAULT_WIDGET_CONFIG, set: null }

export const STORAGE_KEY = 'chasing-card-widget:config'

export const validateConfigForm = ({ settings, set }: ConfigFormState): ConfigErrors => {
  const errors: ConfigErrors = {}
  const { min, max } = WIDGET_LIMITS.total

  if (settings.tcg === null) errors.tcg = 'Selecciona un TCG.'
  if (!set) errors.set = 'Selecciona un set.'
  if (!Number.isInteger(settings.total) || settings.total < min || settings.total > max) {
    errors.total = `La cantidad de cartas debe estar entre ${min} y ${max}.`
  }
  if (settings.showTitle && !settings.title.trim()) {
    errors.title = 'El título no puede quedar vacío.'
  }

  return errors
}

export const toWidgetConfig = (state: ConfigFormState): WidgetConfig | null => {
  if (!state.set || Object.keys(validateConfigForm(state)).length > 0) return null
  return { ...state.settings, title: state.settings.title.trim(), setId: state.set.setNameId }
}

const isTcgSet = (value: unknown): value is TcgSet => {
  const set = value as TcgSet | null
  return (
    typeof set === 'object' &&
    set !== null &&
    typeof set.setNameId === 'number' &&
    typeof set.categoryId === 'number' &&
    typeof set.name === 'string'
  )
}

export const loadFormState = (): ConfigFormState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return INITIAL_FORM_STATE

    const stored = JSON.parse(raw) as { settings?: unknown; set?: unknown }
    const settings = parseWidgetSettings(
      new URLSearchParams(typeof stored.settings === 'string' ? stored.settings : ''),
    )
    const set = isTcgSet(stored.set) && stored.set.categoryId === settings.tcg ? stored.set : null

    return { settings, set }
  } catch {
    return INITIAL_FORM_STATE
  }
}

export const saveFormState = ({ settings, set }: ConfigFormState) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ settings: toWidgetParams(settings).toString(), set }),
    )
  } catch {
    return
  }
}
