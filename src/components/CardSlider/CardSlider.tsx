import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { type ReactNode, useEffect, useState } from 'react'
import type { AnimationType, ChasingCard } from '@/types'
import './CardSlider.css'

interface CardSliderProps {
  cards: ChasingCard[]
  duration: number
  animation: AnimationType
  renderCard: (card: ChasingCard) => ReactNode
}

const TRANSITION_SECONDS = 0.5

const VARIANTS: Record<AnimationType, Variants> = {
  slide: {
    enter: { y: 50, opacity: 0 },
    center: { y: 0, opacity: 1 },
    exit: { y: -50, opacity: 0 },
  },
  fade: {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
  },
  flip: {
    enter: { rotateY: 90, opacity: 0 },
    center: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  },
}

const preloadImage = (url: string) => {
  const image = new Image()
  image.src = url
}

const CardSlider = ({ cards, duration, animation, renderCard }: CardSliderProps) => {
  const [current, setCurrent] = useState(0)
  const total = cards.length
  const index = total > 0 ? current % total : 0
  const card = cards[index]
  const nextCard = total > 1 ? cards[(index + 1) % total] : undefined

  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(
      () => setCurrent((previous) => (previous + 1) % total),
      duration * 1000,
    )
    return () => clearInterval(timer)
  }, [total, duration])

  useEffect(() => {
    if (nextCard) preloadImage(nextCard.imageUrl)
  }, [nextCard])

  if (!card) return null

  if (total === 1) {
    return <div className="card-slider">{renderCard(card)}</div>
  }

  return (
    <div className="card-slider">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={card.productId}
          variants={VARIANTS[animation]}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: TRANSITION_SECONDS }}
          className="card-slider__item"
          data-testid="card-slide"
        >
          {renderCard(card)}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default CardSlider
