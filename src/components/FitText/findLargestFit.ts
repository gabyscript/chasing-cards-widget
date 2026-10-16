export interface FitResult {
  fontSize: number
  truncated: boolean
}

export const findLargestFit = (
  minFontSize: number,
  maxFontSize: number,
  fits: (fontSize: number) => boolean,
): FitResult => {
  if (!fits(minFontSize)) return { fontSize: minFontSize, truncated: true }

  let low = minFontSize
  let high = maxFontSize
  while (low < high) {
    const candidate = Math.ceil((low + high) / 2)
    if (fits(candidate)) {
      low = candidate
    } else {
      high = candidate - 1
    }
  }

  return { fontSize: low, truncated: false }
}
