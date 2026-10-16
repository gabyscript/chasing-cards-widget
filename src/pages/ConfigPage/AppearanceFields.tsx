import { useState } from 'react'
import { Form } from 'react-bootstrap'
import { WIDGET_LIMITS } from '@/lib/widgetConfig'
import type { TextColor, WidgetSettings } from '@/types'

interface AppearanceFieldsProps {
  settings: WidgetSettings
  onChange: (patch: Partial<WidgetSettings>) => void
}

const DEFAULT_CUSTOM_COLOR: TextColor = '#ffcc00'

const isCustomColor = (color: TextColor) => color !== 'white' && color !== 'black'

const AppearanceFields = ({ settings, onChange }: AppearanceFieldsProps) => {
  const [customColor, setCustomColor] = useState<TextColor>(
    isCustomColor(settings.textColor) ? settings.textColor : DEFAULT_CUSTOM_COLOR,
  )

  const colorOptions: { id: string; label: string; value: TextColor }[] = [
    { id: 'color-white', label: 'Texto claro', value: 'white' },
    { id: 'color-black', label: 'Texto oscuro', value: 'black' },
    { id: 'color-custom', label: 'Personalizado', value: customColor },
  ]

  return (
    <>
      <Form.Group className="mb-3">
        <Form.Label as="div">Color del texto</Form.Label>
        <div className="d-flex flex-wrap align-items-center gap-3">
          {colorOptions.map((option) => (
            <Form.Check
              key={option.id}
              type="radio"
              id={option.id}
              name="text-color"
              label={option.label}
              checked={
                option.id === 'color-custom'
                  ? isCustomColor(settings.textColor)
                  : settings.textColor === option.value
              }
              onChange={() => onChange({ textColor: option.value })}
            />
          ))}
          <Form.Control
            type="color"
            aria-label="Color personalizado"
            className="form-control-color"
            value={customColor}
            disabled={!isCustomColor(settings.textColor)}
            onChange={(event) => {
              const color = event.target.value.toLowerCase() as TextColor
              setCustomColor(color)
              onChange({ textColor: color })
            }}
          />
        </div>
      </Form.Group>

      <Form.Group className="mb-3" controlId="card-width-range">
        <Form.Label>
          Ancho de la carta: <strong>{settings.cardWidth} px</strong>
        </Form.Label>
        <Form.Range
          min={WIDGET_LIMITS.cardWidth.min}
          max={WIDGET_LIMITS.cardWidth.max}
          step={10}
          value={settings.cardWidth}
          onChange={(event) => onChange({ cardWidth: Number(event.target.value) })}
        />
      </Form.Group>
    </>
  )
}

export default AppearanceFields
