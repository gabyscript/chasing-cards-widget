import { useEffect, useState } from 'react'
import { Button, Form, InputGroup } from 'react-bootstrap'
import type { ConfigErrors } from './configForm'

interface WidgetLinkBoxProps {
  url: string | null
  errors: ConfigErrors
}

type CopyStatus = 'idle' | 'copied' | 'failed'

const COPY_FEEDBACK_MS = 2000

const WidgetLinkBox = ({ url, errors }: WidgetLinkBoxProps) => {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')

  useEffect(() => {
    if (copyStatus === 'idle') return
    const timer = setTimeout(() => setCopyStatus('idle'), COPY_FEEDBACK_MS)
    return () => clearTimeout(timer)
  }, [copyStatus])

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
  }

  const pending = Object.values(errors)

  return (
    <div>
      <Form.Label htmlFor="widget-url">Link del widget</Form.Label>
      <InputGroup>
        <Form.Control
          id="widget-url"
          readOnly
          value={url ?? ''}
          placeholder="Completa la configuración para generar el link"
          onFocus={(event) => event.target.select()}
        />
        <Button
          variant={copyStatus === 'copied' ? 'success' : 'primary'}
          disabled={!url}
          onClick={handleCopy}
        >
          {copyStatus === 'copied' ? (
            '¡Copiado!'
          ) : (
            <>
              <i className="bi bi-clipboard me-1" aria-hidden="true" />
              Copiar
            </>
          )}
        </Button>
        <Button
          variant="outline-secondary"
          href={url ?? undefined}
          target="_blank"
          rel="noreferrer"
          disabled={!url}
          aria-label="Abrir widget en una pestaña nueva"
        >
          <i className="bi bi-box-arrow-up-right" aria-hidden="true" />
        </Button>
      </InputGroup>
      {copyStatus === 'failed' && (
        <Form.Text className="text-danger">
          No se pudo copiar automáticamente. Selecciona el link y cópialo manualmente.
        </Form.Text>
      )}
      {pending.length > 0 && (
        <ul className="small text-body-secondary mt-2 mb-0 ps-3">
          {pending.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default WidgetLinkBox
