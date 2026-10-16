import { useEffectEvent, useLayoutEffect, useRef } from 'react'
import { type FitResult, findLargestFit } from './findLargestFit'
import './FitText.css'

interface FitTextProps {
  text: string
  as?: 'h1' | 'span'
  className?: string
  width: number
  height: number
  maxFontSize: number
  minFontSize: number
  lineHeight: number
  onFit?: (result: FitResult) => void
}

const CLAMPED_CLASS = 'fit-text__content--clamped'

const FitText = ({
  text,
  as = 'span',
  className,
  width,
  height,
  maxFontSize,
  minFontSize,
  lineHeight,
  onFit,
}: FitTextProps) => {
  const boxRef = useRef<HTMLHeadingElement & HTMLSpanElement>(null)
  const contentRef = useRef<HTMLSpanElement>(null)
  const notifyFit = useEffectEvent((result: FitResult) => onFit?.(result))

  useLayoutEffect(() => {
    const box = boxRef.current
    const content = contentRef.current
    if (!box || !content) return

    const fit = () => {
      content.classList.remove(CLAMPED_CLASS)
      const result = findLargestFit(minFontSize, maxFontSize, (fontSize) => {
        box.style.fontSize = `${fontSize}px`
        return content.scrollHeight <= box.clientHeight
      })
      box.style.fontSize = `${result.fontSize}px`
      const lines = Math.max(1, Math.floor(height / (result.fontSize * lineHeight)))
      content.style.setProperty('--fit-lines', String(lines))
      content.classList.toggle(CLAMPED_CLASS, result.truncated)
      notifyFit(result)
    }

    fit()

    const fonts = document.fonts as FontFaceSet | undefined
    if (!fonts) return
    let active = true
    void fonts.ready.then(() => {
      if (active) fit()
    })
    fonts.addEventListener('loadingdone', fit)
    return () => {
      active = false
      fonts.removeEventListener('loadingdone', fit)
    }
  }, [text, width, height, maxFontSize, minFontSize, lineHeight])

  const Box = as

  return (
    <Box
      ref={boxRef}
      className={['fit-text', className].filter(Boolean).join(' ')}
      style={{ width, height, lineHeight }}
    >
      <span ref={contentRef} className="fit-text__content">
        {text}
      </span>
    </Box>
  )
}

export default FitText
