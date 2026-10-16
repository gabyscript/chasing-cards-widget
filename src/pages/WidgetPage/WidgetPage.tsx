import { useEffect } from 'react'
import { useSearchParams } from 'react-router'
import WidgetView from '@/components/WidgetView/WidgetView'
import { useChasingCards } from '@/hooks/useChasingCards'
import { parseWidgetConfig } from '@/lib/widgetConfig'
import { isRetryableError } from '@/services/api'
import type { WidgetConfig } from '@/types'
import './WidgetPage.css'

const TRANSPARENT_CLASS = 'widget-transparent'

const useTransparentBackground = () => {
  useEffect(() => {
    document.documentElement.classList.add(TRANSPARENT_CLASS)
    return () => document.documentElement.classList.remove(TRANSPARENT_CLASS)
  }, [])
}

const ChasingCardsWidget = ({ config }: { config: WidgetConfig }) => {
  const { data, error } = useChasingCards(config)

  const status = (() => {
    if (data) return data.cards.length === 0 ? 'Este set no tiene cartas con precio.' : null
    if (!error) return null
    return isRetryableError(error)
      ? 'No se pudo conectar con TCGplayer. Reintentando…'
      : error.message
  })()

  return <WidgetView settings={config} data={data} status={status} />
}

const WidgetPage = () => {
  useTransparentBackground()
  const [searchParams] = useSearchParams()
  const result = parseWidgetConfig(searchParams)

  if (!result.ok) {
    return <p className="widget-page__invalid">Link de widget inválido. {result.error}</p>
  }

  return <ChasingCardsWidget config={result.config} />
}

export default WidgetPage
