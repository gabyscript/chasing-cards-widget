import { DEFAULT_WIDGET_CONFIG, WIDGET_LIMITS } from '@/lib/widgetConfig'
import type { TcgSet } from '@/types'
import {
  type ConfigFormState,
  INITIAL_FORM_STATE,
  loadFormState,
  saveFormState,
  STORAGE_KEY,
  toWidgetConfig,
  validateConfigForm,
} from './configForm'

const baseSet: TcgSet = {
  setNameId: 604,
  categoryId: 3,
  name: 'Base Set',
  abbreviation: 'BS',
  releaseDate: '1999-01-09T00:00:00',
  isSupplemental: false,
}

const validState: ConfigFormState = {
  settings: { ...DEFAULT_WIDGET_CONFIG, tcg: 3 },
  set: baseSet,
}

beforeEach(() => {
  localStorage.clear()
})

describe('validateConfigForm', () => {
  it('no reporta errores con una configuración válida', () => {
    expect(validateConfigForm(validState)).toEqual({})
  })

  it('exige TCG y set', () => {
    expect(Object.keys(validateConfigForm(INITIAL_FORM_STATE))).toEqual(['tcg', 'set'])
  })

  it.each([NaN, 4.5, WIDGET_LIMITS.total.min - 1, WIDGET_LIMITS.total.max + 1])(
    'rechaza una cantidad de cartas inválida: %s',
    (total) => {
      const state = { ...validState, settings: { ...validState.settings, total } }
      expect(validateConfigForm(state).total).toBeDefined()
    },
  )

  it('exige título solo cuando se muestra', () => {
    const withTitle = { ...validState, settings: { ...validState.settings, title: '  ' } }
    const withoutTitle = { ...withTitle, settings: { ...withTitle.settings, showTitle: false } }

    expect(validateConfigForm(withTitle).title).toBeDefined()
    expect(validateConfigForm(withoutTitle).title).toBeUndefined()
  })
})

describe('toWidgetConfig', () => {
  it('arma la config del widget con el setId del set elegido', () => {
    expect(toWidgetConfig(validState)).toEqual({ ...validState.settings, setId: 604 })
  })

  it('recorta espacios del título', () => {
    const state = { ...validState, settings: { ...validState.settings, title: '  Top {set} ' } }
    expect(toWidgetConfig(state)?.title).toBe('Top {set}')
  })

  it('devuelve null si el formulario es inválido', () => {
    expect(toWidgetConfig(INITIAL_FORM_STATE)).toBeNull()
  })
})

describe('persistencia', () => {
  it('devuelve el estado inicial si no hay nada guardado', () => {
    expect(loadFormState()).toEqual(INITIAL_FORM_STATE)
  })

  it('restaura lo guardado', () => {
    const state: ConfigFormState = {
      settings: { ...validState.settings, total: 9, textColor: '#ff0000', showName: true },
      set: baseSet,
    }
    saveFormState(state)

    expect(loadFormState()).toEqual(state)
  })

  it('sanea valores fuera de rango guardados', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings: 'tcg=3&total=999', set: null }))

    expect(loadFormState().settings.total).toBe(WIDGET_LIMITS.total.max)
  })

  it('descarta el set si no corresponde al TCG guardado', () => {
    saveFormState({ settings: { ...validState.settings, tcg: 2 }, set: baseSet })

    expect(loadFormState().set).toBeNull()
  })

  it.each(['{no es json', JSON.stringify({ settings: 1, set: { foo: 'bar' } })])(
    'tolera datos corruptos: %s',
    (raw) => {
      localStorage.setItem(STORAGE_KEY, raw)
      expect(loadFormState()).toEqual({ settings: DEFAULT_WIDGET_CONFIG, set: null })
    },
  )

  it('no falla si localStorage no está disponible', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })

    expect(() => saveFormState(validState)).not.toThrow()
    expect(loadFormState()).toEqual(INITIAL_FORM_STATE)

    vi.restoreAllMocks()
  })
})
