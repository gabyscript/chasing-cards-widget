import { Form } from 'react-bootstrap'
import { ANIMATION_TYPES, WIDGET_LIMITS } from '@/lib/widgetConfig'
import type { AnimationType, WidgetSettings } from '@/types'

interface AnimationFieldsProps {
  settings: WidgetSettings
  onChange: (patch: Partial<WidgetSettings>) => void
}

const ANIMATION_LABELS: Record<AnimationType, string> = {
  slide: 'Deslizar',
  fade: 'Desvanecer',
  flip: 'Girar',
}

const REFRESH_OPTIONS = [
  { value: 0, label: 'Nunca' },
  { value: 5, label: 'Cada 5 minutos' },
  { value: 15, label: 'Cada 15 minutos' },
  { value: 30, label: 'Cada 30 minutos' },
  { value: 60, label: 'Cada hora' },
  { value: 120, label: 'Cada 2 horas' },
]

const AnimationFields = ({ settings, onChange }: AnimationFieldsProps) => (
  <>
    <Form.Group className="mb-3" controlId="duration-range">
      <Form.Label>
        Tiempo por carta: <strong>{settings.duration} s</strong>
      </Form.Label>
      <Form.Range
        min={WIDGET_LIMITS.duration.min}
        max={WIDGET_LIMITS.duration.max}
        value={settings.duration}
        onChange={(event) => onChange({ duration: Number(event.target.value) })}
      />
    </Form.Group>

    <Form.Group className="mb-3" controlId="animation-select">
      <Form.Label>Animación</Form.Label>
      <Form.Select
        value={settings.animation}
        onChange={(event) => onChange({ animation: event.target.value as AnimationType })}
      >
        {ANIMATION_TYPES.map((animation) => (
          <option key={animation} value={animation}>
            {ANIMATION_LABELS[animation]}
          </option>
        ))}
      </Form.Select>
    </Form.Group>

    <Form.Group className="mb-3" controlId="refresh-select">
      <Form.Label>Actualizar precios</Form.Label>
      <Form.Select
        value={settings.refresh}
        onChange={(event) => onChange({ refresh: Number(event.target.value) })}
      >
        {REFRESH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Form.Select>
      <Form.Text>
        Útil en streams largos para reflejar cambios de precio sin recargar OBS.
      </Form.Text>
    </Form.Group>
  </>
)

export default AnimationFields
