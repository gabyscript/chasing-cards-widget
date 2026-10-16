import { useState } from 'react'
import { ToggleButton, ToggleButtonGroup } from 'react-bootstrap'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

interface WidgetPreviewProps {
  url: string | null
  size: { width: number; height: number }
}

type PreviewBackground = 'dark' | 'light' | 'checker'

const BACKGROUNDS: { value: PreviewBackground; label: string }[] = [
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
  { value: 'checker', label: 'Transparente' },
]

const PREVIEW_DEBOUNCE_MS = 400

const WidgetPreview = ({ url, size }: WidgetPreviewProps) => {
  const [background, setBackground] = useState<PreviewBackground>('dark')
  const previewUrl = useDebouncedValue(url, PREVIEW_DEBOUNCE_MS)

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-2">
        <span className="fw-semibold">Vista previa</span>
        <ToggleButtonGroup
          type="radio"
          name="preview-background"
          size="sm"
          value={background}
          onChange={(value: PreviewBackground) => setBackground(value)}
        >
          {BACKGROUNDS.map((option) => (
            <ToggleButton
              key={option.value}
              id={`preview-bg-${option.value}`}
              value={option.value}
              variant="outline-secondary"
            >
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </div>
      <div className={`widget-preview widget-preview--${background}`}>
        {previewUrl ? (
          <iframe
            title="Vista previa del widget"
            src={previewUrl}
            width={size.width}
            height={size.height}
            className="widget-preview__frame"
          />
        ) : (
          <p className="widget-preview__empty">
            Selecciona un TCG y un set para ver la vista previa.
          </p>
        )}
      </div>
    </div>
  )
}

export default WidgetPreview
