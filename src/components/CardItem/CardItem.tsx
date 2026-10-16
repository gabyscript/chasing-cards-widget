import { useState } from 'react'
import FitText from '@/components/FitText/FitText'
import { formatPrice } from '@/lib/format'
import { WIDGET_LAYOUT, WIDGET_TYPOGRAPHY } from '@/lib/widgetConfig'
import type { ChasingCard, Currency } from '@/types'
import './CardItem.css'

interface CardItemProps {
  card: ChasingCard
  cardWidth: number
  showName: boolean
  showPrice: boolean
  currency: Currency
}

const CardItem = ({ card, cardWidth, showName, showPrice, currency }: CardItemProps) => {
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <figure className="card-item">
      <div className="card-item__image-box">
        {imageFailed ? (
          <div className="card-item__fallback titan-text">{card.name}</div>
        ) : (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="card-item__image"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      {(showName || showPrice) && (
        <figcaption className="card-item__caption titan-text">
          {showName && (
            <FitText
              className="card-item__name"
              text={card.name}
              width={cardWidth}
              height={WIDGET_LAYOUT.nameHeight}
              {...WIDGET_TYPOGRAPHY.name}
            />
          )}
          {showPrice && (
            <span className="card-item__price">{formatPrice(card.marketPrice, currency)}</span>
          )}
        </figcaption>
      )}
    </figure>
  )
}

export default CardItem
