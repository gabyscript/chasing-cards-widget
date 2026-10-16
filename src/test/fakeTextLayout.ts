const px = (value: string) => Number.parseFloat(value) || 0

export const installFakeTextLayout = (charWidthRatio = 0.8) => {
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return px(this.style.height)
  })

  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    const box = this.parentElement
    if (!this.classList.contains('fit-text__content') || !box) return 0

    const fontSize = px(box.style.fontSize)
    const lineHeight = Number(box.style.lineHeight) || 1
    const charsPerLine = Math.max(1, Math.floor(px(box.style.width) / (fontSize * charWidthRatio)))
    const lines = Math.ceil((this.textContent ?? '').length / charsPerLine)
    return lines * fontSize * lineHeight
  })
}
