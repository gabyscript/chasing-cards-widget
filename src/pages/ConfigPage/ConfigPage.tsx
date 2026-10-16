import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import 'react-bootstrap-typeahead/css/Typeahead.css'
import { type ReactNode, useState } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import type { FitResult } from '@/components/FitText/findLargestFit'
import WidgetTitle from '@/components/WidgetView/WidgetTitle'
import { buildWidgetUrl, getWidgetSize, resolveTitle } from '@/lib/widgetConfig'
import AnimationFields from './AnimationFields'
import AppearanceFields from './AppearanceFields'
import ContentFields from './ContentFields'
import ObsInstructions from './ObsInstructions'
import TcgSetFields from './TcgSetFields'
import { useConfigForm } from './useConfigForm'
import WidgetLinkBox from './WidgetLinkBox'
import WidgetPreview from './WidgetPreview'
import './ConfigPage.css'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <Card className="mb-3">
    <Card.Header as="h2" className="h6 mb-0">
      {title}
    </Card.Header>
    <Card.Body>{children}</Card.Body>
  </Card>
)

const ConfigPage = () => {
  const form = useConfigForm()
  const { settings, set } = form.state
  const widgetUrl = form.config ? buildWidgetUrl(form.config) : null
  const widgetSize = getWidgetSize(settings)
  const [titleFit, setTitleFit] = useState<FitResult | null>(null)
  const previewTitle =
    set && settings.showTitle && settings.title.trim()
      ? resolveTitle(settings.title, { setName: set.name, setCode: set.abbreviation })
      : null

  const handleTitleFit = (result: FitResult) =>
    setTitleFit((previous) =>
      previous?.fontSize === result.fontSize && previous.truncated === result.truncated
        ? previous
        : result,
    )

  return (
    <div data-bs-theme="dark" className="config-page bg-body text-body min-vh-100">
      <Container className="py-4 py-lg-5">
        <header className="mb-4">
          <h1 className="titan-text h2">Chasing Cards Widget</h1>
          <p className="text-body-secondary mb-0">
            Muestra en tu stream las cartas más valiosas de un set de tu TCG favorito, con precios
            de TCGplayer. Configúralo, copia el link y agrégalo a OBS como fuente de navegador.
          </p>
        </header>

        <Row className="g-4">
          <Col lg={7}>
            <form onSubmit={(event) => event.preventDefault()} noValidate>
              <Section title="1. Juego y set">
                <TcgSetFields
                  tcg={settings.tcg}
                  set={set}
                  errors={form.visibleErrors}
                  onTcgChange={form.selectTcg}
                  onSetChange={form.selectSet}
                  onSetBlur={() => form.touch('set')}
                />
              </Section>
              <Section title="2. Contenido">
                <ContentFields
                  settings={settings}
                  errors={form.visibleErrors}
                  titleFit={previewTitle ? titleFit : null}
                  onChange={form.updateSettings}
                />
              </Section>
              <Section title="3. Animación">
                <AnimationFields settings={settings} onChange={form.updateSettings} />
              </Section>
              <Section title="4. Apariencia">
                <AppearanceFields settings={settings} onChange={form.updateSettings} />
              </Section>
            </form>
          </Col>

          <Col lg={5}>
            <div className="config-page__aside">
              <Card className="mb-3">
                <Card.Body>
                  <WidgetLinkBox url={widgetUrl} errors={form.errors} />
                </Card.Body>
              </Card>
              <Card className="mb-3">
                <Card.Body>
                  <WidgetPreview url={widgetUrl} size={widgetSize} />
                </Card.Body>
              </Card>
              <Card>
                <Card.Body>
                  <ObsInstructions size={widgetSize} />
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Container>
      {previewTitle && (
        <div className="config-page__measure" aria-hidden="true">
          <WidgetTitle text={previewTitle} cardWidth={settings.cardWidth} onFit={handleTitleFit} />
        </div>
      )}
    </div>
  )
}

export default ConfigPage
