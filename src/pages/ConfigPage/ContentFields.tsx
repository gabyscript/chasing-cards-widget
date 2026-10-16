import { Form } from 'react-bootstrap'
import type { FitResult } from '@/components/FitText/findLargestFit'
import {
  CURRENCIES,
  TITLE_CODE_PLACEHOLDER,
  TITLE_SET_PLACEHOLDER,
  WIDGET_LIMITS,
} from '@/lib/widgetConfig'
import type { Currency, WidgetSettings } from '@/types'
import type { ConfigErrors } from './configForm'
import { describedBy } from './describedBy'

interface ContentFieldsProps {
  settings: WidgetSettings
  errors: ConfigErrors
  titleFit: FitResult | null
  onChange: (patch: Partial<WidgetSettings>) => void
}

const SMALL_TITLE_FONT_SIZE = 16

const titleFitHint = (fit: FitResult | null) => {
  if (!fit) return null
  if (fit.truncated) {
    return `Con este ancho el título no cabe completo y se cortará con "…". Aumenta el ancho de la carta o usa ${TITLE_CODE_PLACEHOLDER}.`
  }
  if (fit.fontSize < SMALL_TITLE_FONT_SIZE) {
    return `Con este ancho el título se verá en letra pequeña (${fit.fontSize} px). Aumenta el ancho de la carta o usa ${TITLE_CODE_PLACEHOLDER}.`
  }
  return null
}

const ContentFields = ({ settings, errors, titleFit, onChange }: ContentFieldsProps) => {
  const { min, max } = WIDGET_LIMITS.total
  const titleHint = titleFitHint(titleFit)

  return (
    <>
      <Form.Group className="mb-3" controlId="total-input">
        <Form.Label>Cantidad de cartas</Form.Label>
        <Form.Control
          type="number"
          min={min}
          max={max}
          value={Number.isNaN(settings.total) ? '' : settings.total}
          isInvalid={Boolean(errors.total)}
          aria-invalid={Boolean(errors.total)}
          aria-describedby={describedBy('total-help', errors.total && 'total-error')}
          onChange={(event) =>
            onChange({ total: event.target.value === '' ? NaN : Number(event.target.value) })
          }
        />
        <Form.Text id="total-help">
          Entre {min} y {max} cartas, ordenadas de mayor a menor precio.
        </Form.Text>
        <Form.Control.Feedback type="invalid" id="total-error">
          {errors.total}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Check
        type="switch"
        id="show-price-switch"
        className="mb-2"
        label="Mostrar precio"
        checked={settings.showPrice}
        onChange={(event) => onChange({ showPrice: event.target.checked })}
      />

      <Form.Group className="mb-3 ms-4" controlId="currency-select">
        <Form.Label className="small">Moneda</Form.Label>
        <Form.Select
          size="sm"
          value={settings.currency}
          disabled={!settings.showPrice || CURRENCIES.length === 1}
          onChange={(event) => onChange({ currency: event.target.value as Currency })}
        >
          {CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      <Form.Check
        type="switch"
        id="show-name-switch"
        className="mb-3"
        label="Mostrar nombre de la carta"
        checked={settings.showName}
        onChange={(event) => onChange({ showName: event.target.checked })}
      />

      <Form.Check
        type="switch"
        id="show-title-switch"
        className="mb-2"
        label="Mostrar título"
        checked={settings.showTitle}
        onChange={(event) => onChange({ showTitle: event.target.checked })}
      />

      <Form.Group className="mb-3 ms-4" controlId="title-input">
        <Form.Label className="small">Texto del título</Form.Label>
        <Form.Control
          value={settings.title}
          maxLength={WIDGET_LIMITS.titleMaxLength}
          disabled={!settings.showTitle}
          isInvalid={Boolean(errors.title)}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={describedBy(
            'title-help',
            titleHint && 'title-fit-hint',
            errors.title && 'title-error',
          )}
          onChange={(event) => onChange({ title: event.target.value })}
        />
        <Form.Text id="title-help">
          Usa <code>{TITLE_SET_PLACEHOLDER}</code> para el nombre del set o{' '}
          <code>{TITLE_CODE_PLACEHOLDER}</code> para su código (ej. PSV-EN). Máximo{' '}
          {WIDGET_LIMITS.titleMaxLength} caracteres.
        </Form.Text>
        {titleHint && (
          <Form.Text id="title-fit-hint" className="d-block text-warning">
            <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
            {titleHint}
          </Form.Text>
        )}
        <Form.Control.Feedback type="invalid" id="title-error">
          {errors.title}
        </Form.Control.Feedback>
      </Form.Group>
    </>
  )
}

export default ContentFields
