import type { CSSProperties } from 'react'
import CardItem from '@/components/CardItem/CardItem'
import CardSlider from '@/components/CardSlider/CardSlider'
import { getCardHeight, resolveTextColor, resolveTitle, WIDGET_LAYOUT } from '@/lib/widgetConfig'
import type { ChasingCardsResponse, WidgetSettings } from '@/types'
import WidgetTitle from './WidgetTitle'
import './WidgetView.css'

interface WidgetViewProps {
  settings: WidgetSettings
  data: ChasingCardsResponse | null
  status?: string | null
}

const WidgetView = ({ settings, data, status = null }: WidgetViewProps) => {
  const style = {
    '--card-width': `${settings.cardWidth}px`,
    '--card-height': `${getCardHeight(settings.cardWidth)}px`,
    '--text-color': resolveTextColor(settings.textColor),
    '--widget-padding': `${WIDGET_LAYOUT.padding}px`,
    '--title-gap': `${WIDGET_LAYOUT.titleGap}px`,
    '--price-height': `${WIDGET_LAYOUT.priceHeight}px`,
  } as CSSProperties

  const title = data && settings.showTitle ? resolveTitle(settings.title, data) : null

  return (
    <section className="widget-view" style={style} aria-live="polite">
      {title && <WidgetTitle text={title} cardWidth={settings.cardWidth} />}
      {data && data.cards.length > 0 && (
        <CardSlider
          cards={data.cards}
          duration={settings.duration}
          animation={settings.animation}
          renderCard={(card) => (
            <CardItem
              card={card}
              cardWidth={settings.cardWidth}
              showName={settings.showName}
              showPrice={settings.showPrice}
              currency={settings.currency}
            />
          )}
        />
      )}
      {status && <p className="widget-view__status">{status}</p>}
    </section>
  )
}

export default WidgetView
