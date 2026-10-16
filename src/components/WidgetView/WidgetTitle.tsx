import FitText from '@/components/FitText/FitText'
import type { FitResult } from '@/components/FitText/findLargestFit'
import { WIDGET_LAYOUT, WIDGET_TYPOGRAPHY } from '@/lib/widgetConfig'
import './WidgetTitle.css'

interface WidgetTitleProps {
  text: string
  cardWidth: number
  onFit?: (result: FitResult) => void
}

const WidgetTitle = ({ text, cardWidth, onFit }: WidgetTitleProps) => (
  <FitText
    as="h1"
    className="widget-title titan-text"
    text={text}
    width={cardWidth + WIDGET_LAYOUT.padding}
    height={WIDGET_LAYOUT.titleHeight}
    {...WIDGET_TYPOGRAPHY.title}
    onFit={onFit}
  />
)

export default WidgetTitle
